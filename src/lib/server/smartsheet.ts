import { SMARTSHEET_TOKEN } from '$env/static/private';
import type { PurchaseSnapshot } from '$lib/models/procurement';

/** The official "snapshots" sheet: one row per PurchaseSnapshot, one column per field. */
export const SNAPSHOTS_SHEET = '6165058494457740';

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

export type SnapshotChanges = {
    updates: Record<string, Partial<PurchaseSnapshot>>;
    creates: Record<string, PurchaseSnapshot>;
    deletes: string[];
};

function cellsFor(
    snapshot: Partial<PurchaseSnapshot>,
    columns: Map<string, number>,
    metadata: Map<number, Column>,
    fields = Object.keys(snapshot)
) {
    return fields.flatMap((field) => {
        const columnId = columns.get(field);
        if (columnId === undefined) return [];
        const value = snapshot[field as keyof PurchaseSnapshot];
        // Smartsheet rejects "" for strict picklists. An unset optional cell is blank by omission.
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
    debug('save:start', {
        updateIDs: Object.keys(changes.updates),
        createIDs: Object.keys(changes.creates),
        deleteIDs: changes.deletes
    });
    const sheet = await fetchSheet(SNAPSHOTS_SHEET, fetch);
    const columns = new Map(sheet.columns.map((column) => [column.title, column.id]));
    const columnMetadata = new Map(sheet.columns.map((column) => [column.id, column]));
    const idColumn = columns.get('id');
    const rowsBySnapshotID = new Map(
        sheet.rows.flatMap((row) => {
            const id = row.cells.find((cell) => cell.columnId === idColumn)?.value;
            return id == null ? [] : [[String(id), row.id] as const];
        })
    );
    debug('save:identity-map', {
        idColumn,
        rowCount: rowsBySnapshotID.size,
        rows: Object.fromEntries(rowsBySnapshotID)
    });

    const updates = Object.entries(changes.updates).flatMap(([id, patch]) => {
        const rowId = rowsBySnapshotID.get(id);
        if (rowId === undefined) throw new Error(`Cannot update missing Smartsheet row for ${id}`);
        const cells = cellsFor(patch, columns, columnMetadata);
        validateCells(cells, columnMetadata);
        debug('update:prepared', { snapshotID: id, rowId, fields: Object.keys(patch), cells });
        return [{ id: rowId, cells }];
    });
    if (updates.length) await smartsheetRequest(`/sheets/${SNAPSHOTS_SHEET}/rows`, 'PUT', updates, fetch);

    const creates = Object.values(changes.creates).map((snapshot) => ({
        toBottom: true,
        cells: cellsFor(snapshot, columns, columnMetadata)
    }));
    creates.forEach(({ cells }) => validateCells(cells, columnMetadata));
    debug('create:prepared', {
        snapshotIDs: Object.keys(changes.creates),
        rowFields: creates.map(({ cells }) => cells.map(({ columnId }) => columnId))
    });
    if (creates.length) await smartsheetRequest(`/sheets/${SNAPSHOTS_SHEET}/rows`, 'POST', creates, fetch);

    const deletes = changes.deletes.flatMap((id) => {
        const rowId = rowsBySnapshotID.get(id);
        debug('delete:resolve', { snapshotID: id, rowId: rowId ?? null });
        return rowId === undefined ? [] : [rowId];
    });
    if (deletes.length) {
        await smartsheetRequest(
            `/sheets/${SNAPSHOTS_SHEET}/rows?ids=${encodeURIComponent(deletes.join(','))}`,
            'DELETE',
            undefined,
            fetch
        );
    }
}

/** Every purchase snapshot in the sheet. Columns are matched by title, so their order in the sheet doesn't matter. */
export async function fetchSnapshots(fetch: typeof globalThis.fetch): Promise<PurchaseSnapshot[]> {
    const sheet = await fetchSheet(SNAPSHOTS_SHEET, fetch);
    const titles = new Map(sheet.columns.map((column) => [column.id, column.title]));

    const snapshots = sheet.rows
        .map((row) => {
            const fields: Record<string, unknown> = {};
            for (const cell of row.cells) {
                const title = titles.get(cell.columnId);
                if (title) fields[title] = cell.value ?? null;
            }
            return fields;
        })
        .filter((fields) => fields.id)
        .map((fields) => toSnapshot(fields));
    debug('fetchSnapshots:converted', { snapshotCount: snapshots.length, snapshotIDs: snapshots.map(({ id }) => id) });
    return snapshots;
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
