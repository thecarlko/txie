import { database } from "$lib/data/smartsheet.svelte";
import { budgetTotal, vendorTotal } from "$lib/data/snapshot-fields";

class Bank {

    federal = $state(72_000_000 * 100);
    state = $state(12_340_000 * 100);
    private = $state(12_000_000 * 100);
	account = $derived(this.federal + this.state + this.private);

	// Each request counts once, at its latest version. Rejected requests count for nothing.
	// Approved with a recommended vendor: that vendor's quote
	spent = $derived(sum(database.requests.filter((s) => s.decision === "approved" && database.vendors.chosen(s.request_id)), (s) => vendorTotal(database.vendors.chosen(s.request_id)!)));
	// Approved without a recommended vendor: the envelope FAB Leadership approved
	committed = $derived(sum(database.requests.filter((s) => s.decision === "approved" && !database.vendors.chosen(s.request_id)), (s) => s.approved_budget ?? budgetTotal(s.budget)));
	// No decision yet (draft or in review): the budget asked for
	requested = $derived(sum(database.requests.filter((s) => s.decision === null), (s) => budgetTotal(s.budget)));
	available = $derived(this.account - (this.spent + this.committed + this.requested));

}

function sum<T>(rows: T[], amount: (row: T) => number): number {
	return rows.reduce((total, row) => total + amount(row), 0);
}

export const bank = new Bank();
