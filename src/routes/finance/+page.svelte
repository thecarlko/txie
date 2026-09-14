

<script lang='ts'>
    import { Plot, LineY } from 'svelteplot';
    import Transactions from './transactions.svelte';
    import { formatCurrency } from '$lib/hooks/finance';
    import { Sankey } from '$lib/components/sankey'
    import { bank } from '$lib/data/bank.svelte';
    
	let containerWidth = $state(800);
</script>



<section class='max-w-8xl mx-auto px-[3vw]'>
    <br>
    <br>
    <br>

    <h1 class='font-medium text-2xl mb-4'>Welcome Back, Kobe</h1>
    <article class='grid grid-cols-3 gap-5 mb-10'>
        {@render SankeyOverview()}
        {@render AccountOverview()}
    </article>

    <Transactions /> 
</section>

{#snippet SankeyOverview()}
<div class='col-span-2' bind:clientWidth={containerWidth}>
<Sankey></Sankey>
</div>
{/snippet}

{#snippet AccountOverview()}
<div class='p-4'>
    <h1 class='text-3xl'>{ formatCurrency(bank.account) }</h1>
    <br>
    <p class='text-xl text-red-600'>-{ formatCurrency(bank.spent) } Spent</p>
    <p class='text-xl text-orange-500'>-{ formatCurrency(bank.pending) } Pending</p>
    <p class='text-xl text-yellow-600'>-{ formatCurrency(bank.review) } In Review</p>
    <br>
    <p class='text-2xl'>{ formatCurrency(bank.available) }</p>
</div>
{/snippet}



