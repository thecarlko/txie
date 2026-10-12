import { SMARTSHEET_TOKEN } from '$env/static/private';
import type { PurchaseSnapshot, Vendor } from '$lib/models/procurement';
import type { SheetChanges } from '$lib/data/sheet-changes';

/** The official "snapshots" sheet: one row per PurchaseSnapshot, one column per field. */
export const SNAPSHOTS_SHEET = '6165058494457740';
export const VENDORS_SHEET = '254977336731532';

type Cell = { columnId: number; value?: string | number | boolean; displayValue?: string };
type Column = { id: number; title: string; type?: string; options?: string[] };
type Sheet = {
    columns: Column[];
    rows: { id: number; cells: Cell[] }[];
};

function debug(event: string, details: Record<string, unknown> = {}): void {
    console.debug(`[smartsheet] ${event}`, details);
}

async function fetchSheet(sheetID: string, fetch: typeof globalThis.fetch): Promise<Sheet> {
    debug('fetch:start', { sheetID });
    const response = await fetch(`https://api.smartsheetgov.com/2.0/sheets/${sheetID}`, {
        headers: { Authorization: `Bearer ${SMARTSHEET_TOKEN}` }
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
        debug('fetch:failed', { sheetID, status: response.status, body });
        throw new Error(`Smartsheet fetch failed: ${response.status}${body ? `: ${JSON.stringify(body)}` : ''}`);
    }
    const sheet = body as Sheet;
    debug('fetch:success', {
        sheetID,
        columnCount: sheet.columns?.length ?? 0,
        rowCount: sheet.rows?.length ?? 0,
        columns: sheet.columns?.map(({ id, title, type, options }) => ({ id, title, type, options })) ?? []
    });
    return sheet;
}

export type SnapshotChanges = SheetChanges<PurchaseSnapshot>;
export type VendorChanges = SheetChanges<Vendor>;

function cellsFor(
    snapshot: Partial<PurchaseSnapshot | Vendor>,
    columns: Map<string, number>,
    metadata: Map<number, Column>,
    fields = Object.keys(snapshot)
) {
    return fields.flatMap((field) => {
        const columnId = columns.get(field);
        if (columnId === undefined) return [];
        const value = (snapshot as Record<string, string | number | boolean | null | undefined>)[field];
        if ((value == null || value === '') && metadata.get(columnId)?.type === 'PICKLIST') return [];
        return [{ columnId, value: value ?? '' }];
    });
}

function validateCells(cells: { columnId: number; value?: string | number | boolean }[], metadata: Map<number, Column>): void {
    for (const cell of cells) {
        const column = metadata.get(cell.columnId);
        if (column?.type !== 'PICKLIST' || typeof cell.value !== 'string' || !column.options?.length) continue;
        if (column.options.includes(cell.value)) continue;
        throw new Error(
            `Smartsheet PICKLIST column "${column.title}" (${column.id}) rejects "${cell.value}". ` +
            `Allowed values: ${column.options.join(', ')}`
        );
    }
}

async function smartsheetRequest(
    path: string,
    method: 'POST' | 'PUT' | 'DELETE',
    body: unknown,
    fetch: typeof globalThis.fetch
): Promise<void> {
    const response = await fetch(`https://api.smartsheetgov.com/2.0${path}`, {
        method,
        headers: {
            Authorization: `Bearer ${SMARTSHEET_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: body === undefined ? undefined : JSON.stringify(body)
    });
    if (!response.ok) {
        const detail = await response.text();
        debug('request:failed', { method, path, status: response.status, detail });
        throw new Error(`Smartsheet ${method} ${path} failed: ${response.status}${detail ? `: ${detail}` : ''}`);
    }
    debug('request:success', { method, path, status: response.status });
}

/** Apply only changed cells, new rows, and deleted rows to the official sheet. */
export async function saveSnapshots(changes: SnapshotChanges, fetch: typeof globalThis.fetch): Promise<void> {
    return saveRows(SNAPSHOTS_SHEET, changes, fetch);
}

export async function saveVendors(changes: VendorChanges, fetch: typeof globalThis.fetch): Promise<void> {
    return saveRows(VENDORS_SHEET, changes, fetch);
}

async function saveRows<T extends PurchaseSnapshot | Vendor>(sheetID: string, changes: SheetChanges<T>, fetch: typeof globalThis.fetch): Promise<void> {
    debug('save:start', {
        sheetID,
        updateIDs: Object.keys(changes.updates),
        createIDs: Object.keys(changes.creates),
        deleteIDs: changes.deletes
    });
    const sheet = await fetchSheet(sheetID, fetch);
    const columns = new Map(sheet.columns.map((column) => [column.title, column.id]));
    const columnMetadata = new Map(sheet.columns.map((column) => [column.id, column]));
    const idColumn = columns.get('id');
    if (idColumn === undefined) throw new Error(`Smartsheet ${sheetID} is missing its id column`);
    const rowsByID = new Map(
        sheet.rows.flatMap((row) => {
            const id = row.cells.find((cell) => cell.columnId === idColumn)?.value;
            return id == null ? [] : [[String(id), row.id] as const];
        })
    );
    debug('save:identity-map', {
        idColumn,
        rowCount: rowsByID.size,
        rows: Object.fromEntries(rowsByID)
    });

    const updates = Object.entries(changes.updates).flatMap(([id, patch]) => {
        const rowId = rowsByID.get(id);
        if (rowId === undefined) throw new Error(`Cannot update missing Smartsheet row for ${id}`);
        const cells = cellsFor(patch, columns, columnMetadata);
        validateCells(cells, columnMetadata);
        debug('update:prepared', { snapshotID: id, rowId, fields: Object.keys(patch), cells });
        return [{ id: rowId, cells }];
    });
    const creates = Object.entries(changes.creates).flatMap(([id, row]) => {
        const cells = cellsFor(row, columns, columnMetadata);
        // A retry after a partially successful save must not create duplicate rows.
        const existing = rowsByID.get(id);
        if (existing !== undefined) {
            updates.push({ id: existing, cells });
            return [];
        }
        return [{ toBottom: true, cells }];
    });
    creates.forEach(({ cells }) => validateCells(cells, columnMetadata));
    updates.forEach(({ cells }) => validateCells(cells, columnMetadata));
    debug('create:prepared', {
        snapshotIDs: Object.keys(changes.creates),
        rowFields: creates.map(({ cells }) => cells.map(({ columnId }) => columnId))
    });
    if (updates.length) await smartsheetRequest(`/sheets/${sheetID}/rows`, 'PUT', updates, fetch);
    if (creates.length) await smartsheetRequest(`/sheets/${sheetID}/rows`, 'POST', creates, fetch);

    const deletes = changes.deletes.flatMap((id) => {
        const rowId = rowsByID.get(id);
        debug('delete:resolve', { snapshotID: id, rowId: rowId ?? null });
        return rowId === undefined ? [] : [rowId];
    });
    if (deletes.length) {
        await smartsheetRequest(
            `/sheets/${sheetID}/rows?ids=${encodeURIComponent(deletes.join(','))}`,
            'DELETE',
            undefined,
            fetch
        );
    }
}

/** Every purchase snapshot in the sheet. Columns are matched by title, so their order in the sheet doesn't matter. */
export async function fetchSnapshots(fetch: typeof globalThis.fetch): Promise<PurchaseSnapshot[]> {
    return fetchRows(SNAPSHOTS_SHEET, toSnapshot, fetch);
}

/** Vendor quotes from the official sheet, matched by column title. */
export async function fetchVendors(fetch: typeof globalThis.fetch): Promise<Vendor[]> {
    return fetchRows(VENDORS_SHEET, toVendor, fetch);
}

async function fetchRows<T>(sheetID: string, convert: (fields: Record<string, unknown>) => T, fetch: typeof globalThis.fetch): Promise<T[]> {
    const sheet = await fetchSheet(sheetID, fetch);
    const titles = new Map(sheet.columns.map((column) => [column.id, column.title]));

    const rows = sheet.rows
        .map((row) => {
            const fields: Record<string, unknown> = {};
            for (const cell of row.cells) {
                const title = titles.get(cell.columnId);
                if (title) fields[title] = cell.value ?? null;
            }
            return fields;
        })
        .filter((fields) => fields.id)
        .map(convert);
    debug('fetchRows:converted', { sheetID, rowCount: rows.length });
    return rows;
}

function toSnapshot(fields: Record<string, unknown>): PurchaseSnapshot {
    const text = (key: string) => (fields[key] == null ? null : String(fields[key]));

    return {
        id: text('id')!,
        request_id: text('request_id')!,
        created_at: text('created_at')!,
        updated_at: text('updated_at')!,
        location: text('location') as PurchaseSnapshot['location'],
        purpose: text('purpose') ?? '',
        purpose_type: text('purpose_type') as PurchaseSnapshot['purpose_type'],
        purpose_details: text('purpose_details'),
        current_gap: text('current_gap'),
        programs: text('programs'),
        personnel: text('personnel'),
        specs: text('specs'),
        budget: text('budget'),
        attachments: text('attachments'),
        target_date: text('target_date')!,
        date_firmness: text('date_firmness') as PurchaseSnapshot['date_firmness'],
        date_force: text('date_force') as PurchaseSnapshot['date_force'],
        forwarded: fields.forwarded === true,
        decision: text('decision') as PurchaseSnapshot['decision'],
        decision_comments: text('decision_comments')
    };
}

function toVendor(fields: Record<string, unknown>): Vendor {
    const text = (key: string) => (fields[key] == null ? null : String(fields[key]));
    const number = (key: string) => {
        if (fields[key] == null || fields[key] === '') return null;
        const value = Number(fields[key]);
        if (!Number.isFinite(value)) throw new Error(`Vendor ${fields.id} has an invalid ${key}`);
        return value;
    };
    return {
        id: text('id')!,
        request_id: text('request_id')!,
        created_at: text('created_at') ?? '',
        updated_at: text('updated_at') ?? '',
        manufacturer: text('manufacturer') ?? '',
        model: text('model') ?? '',
        configuration: text('configuration'),
        lead_time_weeks: number('lead_time_weeks'),
        costs: text('costs'),
        discount: number('discount'),
        support_items: text('support_items'),
        footprint: text('footprint'),
        utilities: text('utilities'),
        utility_notes: text('utility_notes'),
        facility_analysis: fields.facility_analysis === true,
        facility_work: text('facility_work'),
        facility_lead_time_weeks: number('facility_lead_time_weeks'),
        facility_approved: fields.facility_approved === true,
        flags: text('flags'),
        recommended: fields.recommended === true
    };
}
