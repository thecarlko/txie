import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test, mock } from 'node:test';
import ts from 'typescript';
import { compileModule } from 'svelte/compiler';
import type { PurchaseSnapshot, Vendor } from '../src/lib/models/procurement';

// Compile the real Svelte stores with a browser/storage mock; no live sheet writes.
let moduleID = 0;
const moduleURL = (source: string) => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
function sourceURL(path: string, imports: Record<string, string> = {}): string {
    let source = readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
    for (const [name, url] of Object.entries(imports)) {
        source = source.replaceAll(`'${name}'`, JSON.stringify(url)).replaceAll(`"${name}"`, JSON.stringify(url));
    }
    source += `\nexport const testModuleID = ${++moduleID};`;
    let code = ts.transpileModule(source, {
        compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext }
    }).outputText;
    if (path.endsWith('.svelte.ts')) {
        code = compileModule(code, { filename: path.replace(/\.ts$/, '.js'), generate: 'client' }).js.code;
        code = code.replaceAll("'svelte/internal/client'", JSON.stringify(import.meta.resolve('svelte/internal/client')));
    }
    return moduleURL(code);
}

mock.method(console, 'debug', () => {});
const changesURL = sourceURL('src/lib/data/sheet-changes.ts');
const fieldsURL = sourceURL('src/lib/data/snapshot-fields.ts');
const envURL = moduleURL('export const browser = true;');
const syncURL = sourceURL('src/lib/data/sheet-sync.svelte.ts', {
    '$app/environment': envURL, './sheet-changes': changesURL
});
const server = await import(sourceURL('src/lib/server/smartsheet.ts', {
    '$env/static/private': moduleURL('export const SMARTSHEET_TOKEN = "test-token";')
})) as typeof import('../src/lib/server/smartsheet');

const storage = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key)
} });
async function database() {
    storage.clear();
    return (await import(sourceURL('src/lib/data/smartsheet.svelte.ts', {
        '$lib/data/sheet-sync.svelte': syncURL, '$lib/data/snapshot-fields': fieldsURL
    })) as typeof import('../src/lib/data/smartsheet.svelte')).database;
}
const snapshot = (): PurchaseSnapshot => ({
    id: 'EPG-01-1', request_id: 'EPG-01', created_at: '2026-10-01', updated_at: '2026-10-01',
    location: 'MER', purpose: 'Tool', purpose_type: 'new_capability', purpose_details: null,
    current_gap: 'Gap', programs: null, personnel: 'Owner:owner@example.com:equipment_owner',
    specs: null, budget: 'purchase-10000', attachments: null, target_date: '2026-12-31',
    date_firmness: 'flexible', date_force: 'none', forwarded: false, decision: null, decision_comments: null
});
const vendor = (id = 'EPG-01-V1'): Vendor => ({
    id, request_id: 'EPG-01', created_at: '2026-10-01', updated_at: '2026-10-01', manufacturer: 'Maker', model: 'Model',
    configuration: null, lead_time_weeks: 0, costs: 'purchase-20000', discount: 0, support_items: null,
    footprint: null, utilities: null, utility_notes: null, facility_analysis: false, facility_work: null,
    facility_lead_time_weeks: null, facility_approved: false, flags: null, recommended: false
});
function sheet(rows: Vendor[]) {
    const columns = Object.keys(vendor()).reverse().map((title, i) => ({ id: i + 1, title, type: 'TEXT_NUMBER' }));
    return { columns, rows: rows.map((row, i) => ({ id: 100 + i, cells: columns.map(({ id, title }) => ({
        columnId: id, value: row[title as keyof Vendor]
    })) })) };
}

test('fetches vendor fields by title, preserving null, false and zero values', async () => {
    const raw = sheet([vendor()]);
    raw.rows.push({ id: 999, cells: [] });
    const rows = await server.fetchVendors(async (input) => {
        assert.equal(String(input), 'https://api.smartsheetgov.com/2.0/sheets/254977336731532');
        return Response.json(raw);
    });
    assert.deepEqual(rows, [vendor()]);
});

test('saves changed vendor cells, new quotes and deleted quotes using sheet row IDs', async () => {
    const raw = sheet([vendor(), vendor('EPG-01-V2')]);
    const calls: { url: string; method?: string; body: any }[] = [];
    await server.saveVendors({
        updates: { 'EPG-01-V1': { recommended: true, facility_analysis: false, discount: 0, utility_notes: null } },
        creates: { 'EPG-01-V3': vendor('EPG-01-V3') }, deletes: ['EPG-01-V2']
    }, async (input, init) => {
        calls.push({ url: String(input), method: init?.method, body: init?.body ? JSON.parse(String(init.body)) : null });
        return init?.method ? new Response(null, { status: 200 }) : Response.json(raw);
    });
    assert.deepEqual(calls.map((call) => call.method ?? 'GET'), ['GET', 'PUT', 'POST', 'DELETE']);
    assert.equal(calls[1].body[0].id, 100);
    const cells = Object.fromEntries(calls[1].body[0].cells.map((cell: { columnId: number; value: unknown }) => [
        raw.columns.find((column) => column.id === cell.columnId)!.title, cell.value
    ]));
    assert.deepEqual(cells, { recommended: true, facility_analysis: false, discount: 0, utility_notes: '' });
    assert.equal(calls[2].body[0].toBottom, true);
    assert.equal(calls[3].url, 'https://api.smartsheetgov.com/2.0/sheets/254977336731532/rows?ids=101');
});

test('retrying a partially successful create updates the existing row instead of duplicating it', async () => {
    const methods: string[] = [];
    await server.saveVendors({ updates: {}, creates: { 'EPG-01-V1': vendor() }, deletes: [] }, async (_input, init) => {
        methods.push(init?.method ?? 'GET');
        return init?.method ? new Response(null, { status: 200 }) : Response.json(sheet([vendor()]));
    });
    assert.deepEqual(methods, ['GET', 'PUT']);
});

test('hydrates both sheets and overlays vendor cell edits, creations and tombstones', async () => {
    const db = await database();
    storage.set('txie:vendor_changes', JSON.stringify({
        updates: { 'EPG-01-V1': { model: 'Local model' } },
        creates: { 'EPG-01-V3': vendor('EPG-01-V3') }, deletes: ['EPG-01-V2']
    }));
    // The former JSON cache must not override the new official sheet.
    storage.set('txie:vendors', JSON.stringify({ stale: vendor('stale') }));
    db.hydrate([snapshot()], [{ ...vendor(), manufacturer: 'Remote manufacturer' }, vendor('EPG-01-V2')]);
    assert.equal(db.vendors.get('EPG-01-V1')?.model, 'Local model');
    assert.equal(db.vendors.get('EPG-01-V1')?.manufacturer, 'Remote manufacturer');
    assert.equal(db.vendors.get('EPG-01-V2'), undefined);
    assert.ok(db.vendors.get('EPG-01-V3'));
    assert.equal(db.vendors.get('stale'), undefined);
    db.vendors.update('EPG-01-V1', { model: 'Unsaved edit' });
    db.hydrate([snapshot()], [{ ...vendor(), manufacturer: 'Refreshed manufacturer' }, vendor('EPG-01-V2')]);
    assert.equal(db.vendors.get('EPG-01-V1')?.model, 'Unsaved edit');
    assert.equal(db.vendors.get('EPG-01-V1')?.manufacturer, 'Refreshed manufacturer');
});

test('saves recommendation changes and quotes; a failed vendor save retains edits for retry', async () => {
    const db = await database();
    db.hydrate([snapshot()], [{ ...vendor(), recommended: true }, vendor('EPG-01-V2')]);
    db.vendors.recommend('EPG-01-V2');
    db.vendors.update('EPG-01-V2', { model: 'New model' });
    const created = db.vendors.create('EPG-01');
    const calls: any[] = [];
    const fetchMock = mock.method(globalThis, 'fetch', async (_input: RequestInfo | URL, init?: RequestInit) => {
        calls.push(JSON.parse(String(init?.body)));
        return new Response('Try again', { status: 502 });
    });
    await assert.rejects(db.save(), /Saving vendors.*502/);
    assert.ok(storage.has('txie:vendor_changes'));
    assert.equal(calls[0].sheet, 'vendors');
    assert.equal(calls[0].updates['EPG-01-V1'].recommended, false);
    assert.equal(calls[0].updates['EPG-01-V2'].recommended, true);
    assert.equal(calls[0].creates[created.id].id, created.id);
    fetchMock.mock.mockImplementation(async () => new Response(null, { status: 204 }));
    await db.save();
    assert.equal(storage.has('txie:vendor_changes'), false);
    await db.save();
    assert.equal(fetchMock.mock.callCount(), 2);
    fetchMock.mock.restore();
});

test('saves new purchase requests before their vendor rows', async () => {
    const db = await database();
    db.hydrate([], []);
    const request = db.create();
    db.vendors.create(request.request_id);
    const tables: string[] = [];
    const fetchMock = mock.method(globalThis, 'fetch', async (_input: RequestInfo | URL, init?: RequestInit) => {
        tables.push(JSON.parse(String(init?.body)).sheet);
        return new Response(null, { status: 204 });
    });
    await db.save();
    assert.deepEqual(tables, ['snapshots', 'vendors']);
    fetchMock.mock.restore();
});

test('page-exit saves dispatch both sheets with keepalive before either response returns', async () => {
    const db = await database();
    db.hydrate([snapshot()], [vendor()]);
    db.update('EPG-01-1', { purpose: 'New purpose' });
    db.vendors.update('EPG-01-V1', { model: 'New model' });
    let release!: () => void;
    const pending = new Promise<void>((resolve) => { release = resolve; });
    const tables: string[] = [];
    const fetchMock = mock.method(globalThis, 'fetch', async (_input: RequestInfo | URL, init?: RequestInit) => {
        tables.push(JSON.parse(String(init?.body)).sheet);
        assert.equal(init?.keepalive, true);
        await pending;
        return new Response(null, { status: 204 });
    });
    const saving = db.save({ keepalive: true });
    assert.deepEqual(tables, ['snapshots', 'vendors']);
    release();
    await saving;
    fetchMock.mock.restore();
});

test('successful snapshot saves are not resubmitted when retrying a failed vendor save', async () => {
    const db = await database();
    db.hydrate([snapshot()], [vendor()]);
    db.update('EPG-01-1', { purpose: 'New purpose' });
    db.vendors.update('EPG-01-V1', { model: 'New model' });
    const tables: string[] = [];
    let failVendor = true;
    const fetchMock = mock.method(globalThis, 'fetch', async (_input: RequestInfo | URL, init?: RequestInit) => {
        const table = JSON.parse(String(init?.body)).sheet;
        tables.push(table);
        return table === 'vendors' && failVendor
            ? new Response('Failed', { status: 502 })
            : new Response(null, { status: 204 });
    });
    await assert.rejects(db.save(), /Saving vendors/);
    assert.equal(storage.has('txie:purchase_snapshots'), false);
    assert.ok(storage.has('txie:vendor_changes'));
    failVendor = false;
    await db.save();
    assert.deepEqual(tables, ['snapshots', 'vendors', 'vendors']);
    fetchMock.mock.restore();
});

test('changes during an in-flight vendor save are sent in a second batch', async () => {
    const db = await database();
    db.hydrate([snapshot()], [vendor()]);
    db.vendors.update('EPG-01-V1', { model: 'First edit' });
    let release!: () => void;
    let dispatched!: () => void;
    const started = new Promise<void>((resolve) => { dispatched = resolve; });
    const pending = new Promise<void>((resolve) => { release = resolve; });
    const calls: any[] = [];
    const fetchMock = mock.method(globalThis, 'fetch', async (_input: RequestInfo | URL, init?: RequestInit) => {
        calls.push(JSON.parse(String(init?.body)));
        if (calls.length === 1) { dispatched(); await pending; }
        return new Response(null, { status: 204 });
    });
    const saving = db.save();
    await started;
    db.vendors.update('EPG-01-V1', { model: 'Second edit' });
    release();
    await saving;
    assert.equal(calls[0].updates['EPG-01-V1'].model, 'First edit');
    assert.equal(calls[1].updates['EPG-01-V1'].model, 'Second edit');
    assert.equal(storage.has('txie:vendor_changes'), false);
    db.reset();
    assert.equal(db.vendors.get('EPG-01-V1')?.model, 'Second edit');
    fetchMock.mock.restore();
});
