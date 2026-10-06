

class Bank {

    federal = $state(78_000_000);
    state = $state(47_340_000);
    private = $state(12_000_000);
	account = $derived(this.federal + this.state + this.private);

	spent = $derived( 12_000_000);
	committed = $derived( 12_000_000);
	requested = $derived( 12_000_000);
	available = $derived(this.account - (this.spent + this.committed + this.requested));

}
export const bank = new Bank();

