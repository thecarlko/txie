import { database } from "$lib/data/smartsheet.svelte";
import { budgetTotal, stageOf } from "$lib/data/snapshot-fields";

class Bank {

    federal = $state(72_000_000 * 100);
    state = $state(12_340_000 * 100);
    private = $state(12_000_000 * 100);
	account = $derived(this.federal + this.state + this.private);

	// Each request counts once, at its latest version.
	// FAB Leadership's approved envelope, regardless of vendor selection.
	approved = $derived(sum(database.requests.filter((s) => stageOf(s) === "approved"), (s) => s.approved_budget ?? budgetTotal(s.budget)));
	// Only proposals currently awaiting FAB Leadership's decision.
	requested = $derived(sum(database.requests.filter((s) => stageOf(s) === "fab_leadership_review"), (s) => budgetTotal(s.budget)));
	available = $derived(this.account - (this.approved + this.requested));

}

function sum<T>(rows: T[], amount: (row: T) => number): number {
	return rows.reduce((total, row) => total + amount(row), 0);
}

export const bank = new Bank();
