import { browser } from "$app/environment";
import vendorsJSON from "$lib/json/vendors.json";
import type { Decision, PurchaseSnapshot, Vendor } from "$lib/models/procurement";
import { isComplete, isLocked, isProposalComplete, versionOf } from "$lib/data/snapshot-fields";

/** Fields the proposal form may change. Review fields only change through forward() and decide(). */
type Editable = Partial<Omit<PurchaseSnapshot, "id" | "request_id" | "created_at" | "forwarded" | "decision" | "decision_comments" | "approved_budget">>;
type Review = { decision: Decision; comments: string | null; approved_budget?: number | null };
/** Fields the sourcing form may change. `recommended` only changes through recommend(). */
type VendorEditable = Partial<Omit<Vendor, "id" | "request_id" | "created_at" | "updated_at" | "recommended">>;

const SNAPSHOTS_KEY = "txie:purchase_snapshots";
const VENDORS_KEY = "txie:vendors";
type SnapshotChanges = {
    updates: Record<string, Partial<PurchaseSnapshot>>;
    creates: Record<string, PurchaseSnapshot>;
    deletes: string[];
};
function debug(event: string, details: Record<string, unknown> = {}): void {
    console.debug(`[smartsheet] ${event}`, details);
}
const today = () => new Date().toISOString().slice(0, 10); // matches the "YYYY-MM-DD" format in the data
const requestNumber = (s: Pick<PurchaseSnapshot, "request_id">) => Number(s.request_id.split("-")[1]) || 0; // "EPG-07" → 7
/** Newest request first; within a request, drafts in version order (1, 2, 3...). */
const byRequestThenVersion = (a: PurchaseSnapshot, b: PurchaseSnapshot) => requestNumber(b) - requestNumber(a) || versionOf(a) - versionOf(b);
const vendorNumber = (v: Pick<Vendor, "id">) => Number(v.id.split("-V").at(-1)) || 0; // "EPG-12-V2" → 2
/** Newest request first; within a request, vendors in the order they were added. */
const byRequestThenVendor = (a: Vendor, b: Vendor) => requestNumber(b) - requestNumber(a) || vendorNumber(a) - vendorNumber(b);

/** Fresh copy of a JSON table, keyed by row id. */
function seed<T extends { id: string }>(rows: unknown[]): Record<string, T> {
    return Object.fromEntries((structuredClone(rows) as T[]).map((row) => [row.id, row]));
}

/** Saved edits from localStorage if there are any, otherwise the JSON. */
function load<T extends { id: string }>(
    key: string,
    rows: unknown[],
    migrate: (saved: Record<string, any>) => Record<string, T> = (saved) => saved
): Record<string, T> {
    if (browser) {
        try {
            const saved = localStorage.getItem(key);
            if (saved) return migrate(JSON.parse(saved));
        } catch {
            /* corrupt or blocked storage: fall back to the seed */
        }
    }
    return seed(rows);
}

/** Persist a table's edits, debounced so typing in a cell doesn't write on every keystroke. */
function persist(key: string, table: () => unknown): void {
    if (!browser) return;
    $effect.root(() => {
        $effect(() => {
            const json = JSON.stringify(table());
            const timer = setTimeout(() => {
                localStorage.setItem(key, json);
                debug('localStorage:write', { key, bytes: json.length });
            }, 300);
            return () => clearTimeout(timer);
        });
    });
}

function snapshotChanges(snapshots: Record<string, PurchaseSnapshot>, sheet: Record<string, PurchaseSnapshot>): SnapshotChanges {
    const updates: SnapshotChanges["updates"] = {};
    const creates: SnapshotChanges["creates"] = {};
    for (const [id, snapshot] of Object.entries(snapshots)) {
        const official = sheet[id];
        if (!official) {
            creates[id] = snapshot;
            continue;
        }
        const patch = Object.fromEntries(
            Object.keys(snapshot)
                .filter((key) => snapshot[key as keyof PurchaseSnapshot] !== official[key as keyof PurchaseSnapshot])
                .map((key) => [key, snapshot[key as keyof PurchaseSnapshot]])
        ) as Partial<PurchaseSnapshot>;
        if (Object.keys(patch).length) updates[id] = patch;
    }
    const deletes = Object.keys(sheet).filter((id) => !snapshots[id]);
    debug('diff:computed', {
        updateIDs: Object.keys(updates),
        updateFields: Object.fromEntries(Object.entries(updates).map(([id, patch]) => [id, Object.keys(patch)])),
        createIDs: Object.keys(creates),
        deleteIDs: deletes
    });
    return { updates, creates, deletes };
}

/**
 * Saves from before support items, lead times and facility checks existed are missing those columns.
 * Saves from before sourcing moved ahead of FAB Leadership have a `submitted_at` column that's no longer used.
 */
function migrateVendors(vendors: Record<string, any>): Record<string, Vendor> {
    for (const v of Object.values(vendors)) {
        delete v.submitted_at;
        v.configuration ??= null;
        v.lead_time_weeks ??= null;
        v.discount ??= null;
        v.support_items ??= null;
        v.facility_analysis ??= false;
        v.facility_work ??= null;
        v.facility_lead_time_weeks ??= null;
        v.facility_approved ??= false;
    }
    return vendors;
}

/** Saves from before `forwarded` existed stored "draft" / "fab_leadership_review" as decisions. */
function migrate(snapshots: Record<string, any>): Record<string, PurchaseSnapshot> {
    for (const s of Object.values(snapshots)) {
        if (s.forwarded !== undefined) continue;
        s.forwarded = s.decision !== "draft";
        if (s.decision === "draft" || s.decision === "fab_leadership_review") s.decision = null;
        s.decision_comments ??= null;
    }
    return snapshots;
}

/**
 * Vendor quotes, one flat row per vendor. Rows for the same purchase request share its `request_id`.
 * Vendors are sourced alongside the proposal and aren't versioned: they stay editable while the request's
 * latest draft has no decision (including a new draft after changes are requested) and lock once it does.
 */
class VendorSheet {
    vendors = $state<Record<string, Vendor>>(load(VENDORS_KEY, vendorsJSON, migrateVendors));
    rows = $derived(Object.values(this.vendors).sort(byRequestThenVendor));

    #isOpen: (request_id: string) => boolean;

    constructor(isOpen: (request_id: string) => boolean) {
        this.#isOpen = isOpen;
        persist(VENDORS_KEY, () => this.vendors);
    }

    get(id: string): Vendor | undefined {
        return this.vendors[id];
    }

    /** Every vendor quoted for a request, in the order they were added. */
    of(request_id: string): Vendor[] {
        return this.rows.filter((v) => v.request_id === request_id);
    }

    /** The vendor recommended for a request, if one has been picked. */
    chosen(request_id: string): Vendor | undefined {
        return this.of(request_id).find((v) => v.recommended);
    }

    /** Whether a request's vendors can still be changed. */
    isOpen(request_id: string): boolean {
        return this.#isOpen(request_id);
    }

    /** Add a blank vendor to a request that's still being drafted. */
    create(request_id: string, fields: VendorEditable = {}): Vendor {
        this.requireOpen(request_id);

        const number = Math.max(0, ...this.of(request_id).map(vendorNumber)) + 1;
        const vendor: Vendor = {
            manufacturer: "",
            model: "",
            configuration: null,
            lead_time_weeks: null,
            costs: null,
            discount: null,
            support_items: null,
            footprint: null,
            utilities: null,
            utility_notes: null,
            facility_analysis: false,
            facility_work: null,
            facility_lead_time_weeks: null,
            facility_approved: false,
            flags: null,
            ...fields,
            id: `${request_id}-V${number}`,
            request_id,
            created_at: today(),
            updated_at: today(),
            recommended: false,
        };

        this.vendors[vendor.id] = vendor;
        return this.vendors[vendor.id]; // the reactive version
    }

    update(id: string, patch: VendorEditable): void {
        const vendor = this.require(id);
        this.requireOpen(vendor.request_id);
        Object.assign(vendor, patch, { updated_at: today() });
    }

    /** Recommend a vendor, or clear it with `false`. Recommending one clears the rest of its request. */
    recommend(id: string, recommended = true): void {
        const vendor = this.require(id);
        this.requireOpen(vendor.request_id);
        for (const other of this.of(vendor.request_id)) {
            const next = recommended && other.id === id;
            if (other.recommended !== next) Object.assign(other, { recommended: next, updated_at: today() });
        }
    }

    delete(id: string): void {
        this.requireOpen(this.require(id).request_id);
        delete this.vendors[id];
    }

    /** Throw away local edits and go back to vendors.json. */
    reset(): void {
        this.vendors = seed(vendorsJSON);
    }

    private require(id: string): Vendor {
        const vendor = this.vendors[id];
        if (!vendor) throw new Error(`No vendor with id ${id}`);
        return vendor;
    }

    private requireOpen(request_id: string): void {
        if (!this.#isOpen(request_id)) throw new Error(`${request_id} has a decision from FAB Leadership; its vendors can no longer be changed`);
    }
}

/**
 * Purchase snapshots. Rows come from the official Smartsheet through hydrate(); edits made here stay in this
 * browser, saved to localStorage as changed cells plus created and deleted rows.
 */
class SmartSheet {
    snapshots = $state<Record<string, PurchaseSnapshot>>({});
    rows = $derived(Object.values(this.snapshots).sort(byRequestThenVersion));
    vendors = new VendorSheet((request_id) => {
        const latest = this.latest(request_id);
        return !!latest && !isLocked(latest);
    });

    // Latest version of each purchase request, newest request first, for the requests table.
    // Rows are in version order, so the last draft seen for a request is the one that's kept.
    requests = $derived(Object.values(Object.fromEntries(this.rows.map((s) => [s.request_id, s]))));

    /** The sheet's rows as last fetched, before local edits. */
    #sheet: Record<string, PurchaseSnapshot> = {};
    #hydrated = false;
    #saving: Promise<void> | null = null;

    /** Load the sheet's rows, applying this browser's changed cells and row tombstones on top. */
    hydrate(rows: PurchaseSnapshot[]): void {
        debug('hydrate:start', { fetchedRowCount: rows.length, fetchedIDs: rows.map(({ id }) => id) });
        this.#sheet = seed(rows);
        const merged = seed<PurchaseSnapshot>(rows);
        const saved = this.loadChanges();
        debug('hydrate:local-changes', {
            updateIDs: Object.keys(saved.updates),
            createIDs: Object.keys(saved.creates),
            deleteIDs: saved.deletes
        });
        for (const [id, patch] of Object.entries(saved.updates)) {
            if (merged[id]) merged[id] = { ...merged[id], ...patch };
        }
        for (const [id, snapshot] of Object.entries(saved.creates)) merged[id] = snapshot;
        for (const id of saved.deletes) delete merged[id];
        this.snapshots = merged;
        debug('hydrate:complete', { visibleRowCount: Object.keys(merged).length, visibleIDs: Object.keys(merged) });

        // Start saving only once there's something to compare against, so an empty table never overwrites a save.
        if (this.#hydrated) return;
        this.#hydrated = true;
        persist(SNAPSHOTS_KEY, () => snapshotChanges(this.snapshots, this.#sheet));
    }

    private loadChanges(): SnapshotChanges {
        if (!browser) return { updates: {}, creates: {}, deletes: [] };
        try {
            const saved = localStorage.getItem(SNAPSHOTS_KEY);
            if (!saved) {
                debug('localStorage:empty', { key: SNAPSHOTS_KEY });
                return { updates: {}, creates: {}, deletes: [] };
            }
            const parsed = JSON.parse(saved);
            if (parsed.updates && parsed.creates && parsed.deletes) return parsed;
            debug('localStorage:migrate-legacy', { key: SNAPSHOTS_KEY });
            return { updates: migrate(parsed), creates: {}, deletes: [] };
        } catch {
            debug('localStorage:read-failed', { key: SNAPSHOTS_KEY });
            return { updates: {}, creates: {}, deletes: [] };
        }
    }

    /** Send the current local diff to Smartsheet and clear it only after every request succeeds. */
    async save({ keepalive = false }: { keepalive?: boolean } = {}): Promise<void> {
        if (!browser) return;
        if (this.#saving) return this.#saving;
        const changes = snapshotChanges(this.snapshots, this.#sheet);
        if (!changes.deletes.length && !Object.keys(changes.updates).length && !Object.keys(changes.creates).length) return;
        debug('save:dispatch', {
            updateIDs: Object.keys(changes.updates),
            createIDs: Object.keys(changes.creates),
            deleteIDs: changes.deletes
        });

        let completed = false;
        this.#saving = fetch('/api/smartsheet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(changes),
            keepalive
        }).then((response) => {
            debug('save:response', { status: response.status, ok: response.ok });
            if (!response.ok) throw new Error(`Saving Smartsheet changes failed: ${response.status}: ${response.statusText}`);
            completed = true;
            for (const [id, patch] of Object.entries(changes.updates)) {
                if (this.#sheet[id]) this.#sheet[id] = { ...this.#sheet[id], ...patch };
            }
            for (const [id, snapshot] of Object.entries(changes.creates)) this.#sheet[id] = snapshot;
            for (const id of changes.deletes) delete this.#sheet[id];

            const remaining = snapshotChanges(this.snapshots, this.#sheet);
            if (!remaining.deletes.length && !Object.keys(remaining.updates).length && !Object.keys(remaining.creates).length) {
                localStorage.removeItem(SNAPSHOTS_KEY);
                debug('save:complete', { localStorage: 'cleared' });
            } else {
                localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(remaining));
                debug('save:partial', {
                    updateIDs: Object.keys(remaining.updates),
                    createIDs: Object.keys(remaining.creates),
                    deleteIDs: remaining.deletes
                });
            }
        }).catch((error) => {
            debug('save:failed', { error: error instanceof Error ? error.message : String(error) });
            throw error;
        }).finally(() => {
            this.#saving = null;
            const remaining = snapshotChanges(this.snapshots, this.#sheet);
            if (completed && (remaining.deletes.length || Object.keys(remaining.updates).length || Object.keys(remaining.creates).length)) {
                debug('save:deferred-changes', {
                    updateIDs: Object.keys(remaining.updates),
                    createIDs: Object.keys(remaining.creates),
                    deleteIDs: remaining.deletes
                });
            }
        });
        return this.#saving;
    }

    get(id: string): PurchaseSnapshot | undefined {
        return this.snapshots[id];
    }

    /** Every version of a request, oldest first. */
    versions(request_id: string): PurchaseSnapshot[] {
        return this.rows.filter((s) => s.request_id === request_id);
    }

    latest(request_id: string): PurchaseSnapshot | undefined {
        return this.versions(request_id).at(-1);
    }

    /** Start a new purchase request as an editable version 1 snapshot. */
    create(fields: Editable = {}): PurchaseSnapshot {
        // Next number after the highest existing request (IDs have gaps, so don't use the count).
        const highest = Math.max(0, ...Object.values(this.snapshots).map(requestNumber));
        const request_id = `EPG-${String(highest + 1).padStart(2, "0")}`;

        const target = new Date();
        target.setMonth(target.getMonth() + 3);

        const snapshot: PurchaseSnapshot = {
            location: "MER",
            purpose: "",
            purpose_type: "new_capability",
            purpose_details: null,
            current_gap: null,
            programs: null,
            personnel: null,
            specs: null,
            budget: null,
            attachments: null,
            target_date: target.toISOString().slice(0, 10),
            date_firmness: "flexible",
            date_force: "none",
            ...fields,
            id: `${request_id}-1`,
            request_id,
            created_at: today(),
            updated_at: today(),
            forwarded: false,
            decision: null,
            decision_comments: null,
        };

        this.snapshots[snapshot.id] = snapshot;
        debug('snapshot:create', { id: snapshot.id, fields: Object.keys(snapshot) });
        return this.snapshots[snapshot.id]; // the reactive version
    }

    update(id: string, patch: Editable): void {
        const snapshot = this.require(id);
        if (isLocked(snapshot)) throw new Error(`${id} has a decision and can no longer be edited`);
        debug('snapshot:update', { id, fields: Object.keys(patch), values: patch });
        Object.assign(snapshot, patch, { updated_at: today() });
    }

    /**
     * Send an editable snapshot and its sourced vendors to FAB Leadership for review.
     * The proposal must be complete and the recommended vendor needs a manufacturer, model, and purchase price.
     */
    forward(id: string): void {
        const snapshot = this.require(id);
        if (isLocked(snapshot)) throw new Error(`${id} already has a decision`);
        if (!isProposalComplete(snapshot)) throw new Error(`${id} is missing required proposal fields`);
        const chosen = this.vendors.chosen(snapshot.request_id);
        if (!chosen || !isComplete(chosen)) throw new Error(`${snapshot.request_id} needs a complete recommended vendor before review`);
        Object.assign(snapshot, { forwarded: true, updated_at: today() });
        debug('snapshot:forward', { id });
    }

    /**
     * Record FAB Leadership's decision, which locks the snapshot.
     * "changes_requested" also opens the next draft version and returns it.
     */
    decide(id: string, { decision, comments, approved_budget }: Review): PurchaseSnapshot | undefined {
        const snapshot = this.require(id);
        if (!snapshot.forwarded) throw new Error(`${id} hasn't been forwarded to FAB Leadership`);
        if (isLocked(snapshot)) throw new Error(`${id} already has a decision`);

        Object.assign(snapshot, {
            decision,
            decision_comments: comments,
            approved_budget: decision === "approved" ? (approved_budget ?? null) : null,
            updated_at: today(),
        });
        debug('snapshot:decision', { id, decision, fields: ['decision', 'decision_comments', 'approved_budget'] });

        if (decision === "changes_requested") return this.revise(snapshot);
    }

    /** Copy a snapshot into the request's next version, ready for editing. */
    private revise(previous: PurchaseSnapshot): PurchaseSnapshot {
        const version = versionOf(this.latest(previous.request_id) ?? previous) + 1;
        const { approved_budget: _, ...fields } = $state.snapshot(previous);

        const draft: PurchaseSnapshot = {
            ...fields,
            id: `${previous.request_id}-${version}`,
            created_at: today(),
            updated_at: today(),
            forwarded: false,
            decision: null,
            decision_comments: null,
        };

        this.snapshots[draft.id] = draft;
        debug('snapshot:create-revision', { id: draft.id, sourceID: previous.id });
        return this.snapshots[draft.id];
    }

    delete(id: string): void {
        debug('snapshot:delete', { id });
        delete this.snapshots[id];
    }

    /** Throw away local edits and go back to the sheet's rows and vendors.json. */
    reset(): void {
        this.snapshots = structuredClone(this.#sheet);
        this.vendors.reset();
    }

    private require(id: string): PurchaseSnapshot {
        const snapshot = this.snapshots[id];
        if (!snapshot) throw new Error(`No purchase snapshot with id ${id}`);
        return snapshot;
    }
}

export const database = new SmartSheet();
