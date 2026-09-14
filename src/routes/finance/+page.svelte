

<script lang='ts'>
    import { Plot, LineY } from 'svelteplot';
    import Transactions from './transactions.svelte';
    import { formatCurrency } from '$lib/hooks/finance';
    import { transactionsData } from '$lib/data/transactions';


    const nodes = [{ id: 'A' }, { id: 'B' }, { id: 'C' }];
	const links = [
        { source: 'A', target: 'B', value: 10 },
		{ source: 'A', target: 'C', value: 5 }
	];
    
    
	let containerWidth = $state(800);
    let focusTransactions = $derived(transactionsData);
    
    // calculations 
    let account = $state(40_000_000);
    let pending = $derived(focusTransactions.filter((t) => t.status === 'processing').reduce((acc, t) => acc + t.amount, 0));
    let review = $derived(focusTransactions.filter((t) => t.status == 'pending').reduce((acc, t) => acc + t.amount, 0));
    let spent = $derived(focusTransactions.filter((t) => t.status === 'paid').reduce((acc, t) => acc + t.amount, 0));
    let available = $derived(account - (pending + review + spent));
</script>



<section class='max-w-8xl mx-auto px-[3vw]'>
    <br>
    <br>
    <br>

    <h1 class='font-medium text-xl mb-3'>Welcome Back, Kobe</h1>
    <article class='grid grid-cols-3 gap-4 mb-10'>
        {@render SankeyOverview()}
        {@render AccountOverview()}
    </article>

    <Transactions /> 
</section>

{#snippet SankeyOverview()}
<div class='col-span-2 border border-blue-300' bind:clientWidth={containerWidth}>

</div>
{/snippet}

{#snippet AccountOverview()}
<div class='border border-orange-400'>
    <h1 class='text-2xl'>{ formatCurrency(account) }: Account</h1>
    <br>
    <p class="text-lg">{ formatCurrency(spent) } Spent</p>
    <p class='text-lg'>{ formatCurrency(pending) } Pending</p>
    <p class='text-lg'>{ formatCurrency(review) } In Review</p>
    <p class='text-lg'>{ formatCurrency(available) } Current balance</p>
</div>
{/snippet}



