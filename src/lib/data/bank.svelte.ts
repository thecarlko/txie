

class Bank {

    federal = $state(78_000_000);
    state = $state(47_340_000);
    private = $state(12_000_000);
	account = $derived(this.federal + this.state + this.private);

	pending = $derived( 12_000_000);
	review = $derived( 12_000_000);
	spent = $derived( 12_000_000);
	available = $derived(this.account - (this.pending + this.review + this.spent));

}
export const bank = new Bank();

