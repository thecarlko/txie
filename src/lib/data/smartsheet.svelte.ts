import { browser } from "$app/environment";
import snapshotsJSON from "$lib/json/snapshots.json";
import vendorsJSON from "$lib/json/vendors.json";
import type { Decision, PurchaseSnapshot, Vendor } from "$lib/models/procurement";
import { isComplete, isLocked, versionOf } from "$lib/data/snapshot-fields";

/** Fields the proposal form may change. Review fields only change through forward() and decide(). */
type Editable = Partial<Omit<PurchaseSnapshot, "id" | "request_id" | "created_at" | "forwarded" | "decision" | "decision_comments" | "approved_budget">>;
type Review = { decision: Decision; comments: string | null; approved_budget?: number | null };
/** Fields the sourcing form may change. `recommended` only changes through recommend(). */
type VendorEditable = Partial<Omit<Vendor, "id" | "request_id" | "created_at" | "updated_at" | "recommended">>;

const SNAPSHOTS_KEY = "txie:purchase_snapshots";
const VENDORS_KEY = "txie:vendors";
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
            const timer = setTimeout(() => localStorage.setItem(key, json), 300);
            return () => clearTimeout(timer);
        });
    });
}

/** Saves from before support items, lead times and facility checks existed are missing those columns. */
function migrateVendors(vendors: Record<string, any>): Record<string, Vendor> {
    for (const v of Object.values(vendors)) {
        v.configuration ??= null;
        v.lead_time_weeks ??= null;
        v.discount ??= null;
        v.support_items ??= null;
        v.facility_analysis ??= false;
        v.facility_work ??= null;
        v.facility_lead_time_weeks ??= null;
        v.facility_approved ??= false;
        v.submitted_at ??= null;
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
 * Vendors can only be added to a request FAB Leadership has approved, and are locked once submitted.
 */
class VendorSheet {
    vendors = $state<Record<string, Vendor>>(load(VENDORS_KEY, vendorsJSON, migrateVendors));
    rows = $derived(Object.values(this.vendors).sort(byRequestThenVendor));

    #isApproved: (request_id: string) => boolean;

    constructor(isApproved: (request_id: string) => boolean) {
        this.#isApproved = isApproved;
        persist(VENDORS_KEY, () => this.vendors);
    }

    get(id: string): Vendor | undefined {
        return this.vendors[id];
    }

    /** Every vendor quoted for a request, in the order they were added. */
    of(request_id: string): Vendor[] {
        return this.rows.filter((v) => v.request_id === request_id);
    }

    /** Date sourcing was submitted for a request, or null while it's still open. */
    submittedAt(request_id: string): string | null {
        return this.of(request_id).find((v) => v.submitted_at)?.submitted_at ?? null;
    }

    /** Add a blank vendor to an approved request. */
    create(request_id: string, fields: VendorEditable = {}): Vendor {
        if (!this.#isApproved(request_id)) throw new Error(`${request_id} needs an approved proposal before sourcing`);
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
            submitted_at: null,
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

    /**
     * Submit a request's vendors for the executive summary, which locks them.
     * The recommended vendor needs a manufacturer, model, and purchase price.
     */
    submit(request_id: string): void {
        this.requireOpen(request_id);
        const vendors = this.of(request_id);
        const chosen = vendors.find((v) => v.recommended);
        if (!chosen || !isComplete(chosen)) throw new Error(`${request_id} needs a complete recommended vendor to submit`);
        for (const v of vendors) Object.assign(v, { submitted_at: today(), updated_at: today() });
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
        if (this.submittedAt(request_id)) throw new Error(`${request_id} vendors were submitted and can no longer be changed`);
    }
}

class SmartSheet {
    snapshots = $state<Record<string, PurchaseSnapshot>>(load(SNAPSHOTS_KEY, snapshotsJSON, migrate));
    rows = $derived(Object.values(this.snapshots).sort(byRequestThenVersion));
    vendors = new VendorSheet((request_id) => this.versions(request_id).some((s) => s.decision === "approved"));

    // Latest version of each purchase request, newest request first, for the requests table.
    // Rows are in version order, so the last draft seen for a request is the one that's kept.
    requests = $derived(Object.values(Object.fromEntries(this.rows.map((s) => [s.request_id, s]))));

    constructor() {
        persist(SNAPSHOTS_KEY, () => this.snapshots);
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
        return this.snapshots[snapshot.id]; // the reactive version
    }

    update(id: string, patch: Editable): void {
        const snapshot = this.require(id);
        if (isLocked(snapshot)) throw new Error(`${id} has a decision and can no longer be edited`);
        Object.assign(snapshot, patch, { updated_at: today() });
    }

    /** Send an editable snapshot to FAB Leadership for review. */
    forward(id: string): void {
        const snapshot = this.require(id);
        if (isLocked(snapshot)) throw new Error(`${id} already has a decision`);
        Object.assign(snapshot, { forwarded: true, updated_at: today() });
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
        return this.snapshots[draft.id];
    }

    delete(id: string): void {
        delete this.snapshots[id];
    }

    /** Throw away local edits and go back to snapshots.json and vendors.json. */
    reset(): void {
        this.snapshots = seed(snapshotsJSON);
        this.vendors.reset();
    }

    private require(id: string): PurchaseSnapshot {
        const snapshot = this.snapshots[id];
        if (!snapshot) throw new Error(`No purchase snapshot with id ${id}`);
        return snapshot;
    }
}

export const database = new SmartSheet();
