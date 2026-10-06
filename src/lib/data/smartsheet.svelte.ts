import { browser } from "$app/environment";
import snapshotsJSON from "$lib/json/snapshots.json";
import type { Decision, PurchaseSnapshot } from "$lib/models/procurement";
import { isLocked, versionOf } from "$lib/data/snapshot-fields";

/** Fields the proposal form may change. Review fields only change through forward() and decide(). */
type Editable = Partial<Omit<PurchaseSnapshot, "id" | "request_id" | "created_at" | "forwarded" | "decision" | "decision_comments" | "approved_budget">>;
type Review = { decision: Decision; comments: string | null; approved_budget?: number | null };

const STORAGE_KEY = "txie:purchase_snapshots";
const today = () => new Date().toISOString().slice(0, 10); // matches the "YYYY-MM-DD" format in the data
const byId = (a: PurchaseSnapshot, b: PurchaseSnapshot) => a.id.localeCompare(b.id, undefined, { numeric: true });

/** Fresh copy of snapshots.json, keyed by snapshot id. */
function seed(): Record<string, PurchaseSnapshot> {
    const rows = structuredClone(snapshotsJSON) as PurchaseSnapshot[];
    return Object.fromEntries(rows.map((s) => [s.id, s]));
}

/** Saved edits from localStorage if there are any, otherwise the JSON. */
function load(): Record<string, PurchaseSnapshot> {
    if (browser) {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) return migrate(JSON.parse(saved));
        } catch {
            /* corrupt or blocked storage: fall back to the seed */
        }
    }
    return seed();
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

class SmartSheet {
    snapshots = $state<Record<string, PurchaseSnapshot>>(load());
    rows = $derived(Object.values(this.snapshots).sort((a, b) => {
        const dateCompare = b.updated_at.localeCompare(a.updated_at);
        if (dateCompare !== 0) return dateCompare;
        return b.request_id.localeCompare(a.request_id, undefined, { numeric: true });
    }));

    // Latest version of each purchase request, for the requests table
    requests = $derived(Object.values(Object.fromEntries(this.rows.map((s) => [s.request_id, s]))));

    constructor() {
        if (!browser) return;
        // Persist edits, debounced so typing in a cell doesn't write on every keystroke.
        $effect.root(() => {
            $effect(() => {
                const json = JSON.stringify(this.snapshots);
                const timer = setTimeout(() => localStorage.setItem(STORAGE_KEY, json), 300);
                return () => clearTimeout(timer);
            });
        });
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
        const highest = Math.max(0, ...Object.values(this.snapshots).map((s) => Number(s.request_id.split("-")[1]) || 0));
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

    /** Throw away local edits and go back to snapshots.json. */
    reset(): void {
        this.snapshots = seed();
    }

    private require(id: string): PurchaseSnapshot {
        const snapshot = this.snapshots[id];
        if (!snapshot) throw new Error(`No purchase snapshot with id ${id}`);
        return snapshot;
    }
}

export const database = new SmartSheet();
