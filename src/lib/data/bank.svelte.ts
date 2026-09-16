import { transactions, type Transaction } from '$lib/data/transactions.svelte';
import type { PurchaseRequest } from './procurement.svelte';


class Bank {

    federal = $state(78_000_000);
    state = $state(47_340_000);
    private = $state(12_000_000);
	account = $derived(this.federal + this.state + this.private);

	pending = $derived(totalWhere('processing'));
	review = $derived(totalWhere('pending'));
	spent = $derived(totalWhere('paid'));
	available = $derived(this.account - (this.pending + this.review + this.spent));

	purchaseRequests = $state({ }) as Record<string, PurchaseRequest>;

}
export const bank = new Bank();


function totalWhere(status: Transaction['status']) {
	return transactions
		.filter((t) => t.status === status)
		.reduce((acc, t) => acc + t.amount, 0);
}
