

<script lang='ts'>
    import { Plot, LineY } from 'svelteplot';
    import Transactions from './transactions.svelte';
    import { formatCurrency } from '$lib/hooks/finance';

    const [balance, spent, alloted, available] = [50000000, 13578937, 4587109, 31833954];
    const nodes = [{ id: 'A' }, { id: 'B' }, { id: 'C' }];
	const links = [
		{ source: 'A', target: 'B', value: 10 },
		{ source: 'A', target: 'C', value: 5 }
	];
	let containerWidth = $state(800);
</script>



<section class='max-w-8xl mx-auto px-[3vw]'>
    <br>
    <br>
    <br>

    <article class='grid grid-cols-3 gap-4 mb-10'>
        {@render SankeyOverview()}
        {@render AccountOverview()}
    </article>

    <Transactions /> 
</section>

{#snippet SankeyOverview()}
<div bind:clientWidth={containerWidth}>

</div>
{/snippet}

{#snippet AccountOverview()}
<div class='border'>
    <h1 class='text-2xl font-bold'>{ formatCurrency(available) }: Available Balance</h1>
    <br>
    <p class='text-lg'>{ formatCurrency(balance) } Current balance</p>
    <p class="text-lg">{ formatCurrency(spent) } Spent</p>
    <p class='text-lg'>{ formatCurrency(alloted) } Alloted</p>
</div>
{/snippet}



