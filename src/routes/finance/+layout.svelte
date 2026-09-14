

<script lang='ts'>
    import { formatCurrency } from '$lib/hooks/finance';
    import { Sankey } from '$lib/components/sankey'
    import { bank } from '$lib/data/bank.svelte';
    import * as Tabs from "$lib/components/tabs";
    import Button from '$lib/components/button/button.svelte';
    import { page } from '$app/state';
    import Transactions from './transactions/+page.svelte';



	let { children } = $props();
    let tab = $derived(page.url.pathname.split('/')[2] || 'contracts');
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

    <Tabs.Root value={ tab } >
    <Tabs.List variant='line' class='w-56'>
        <Tabs.Trigger class='w-full' value='contracts'><a href='/finance/contracts'>Contracts</a></Tabs.Trigger>
        <Tabs.Trigger class='w-full' value='transactions'><a href='/finance/transactions'>Transactions</a></Tabs.Trigger>
    </Tabs.List>
    </Tabs.Root>
    <br>

    {@render children()}
</section>

{#snippet SankeyOverview()}
<div class='col-span-2'>
<Sankey></Sankey>
</div>
{/snippet}

{#snippet AccountOverview()}
<div class='p-4'>
    <h1 class='text-3xl'>{ formatCurrency(bank.account) }</h1>
    <br>
    <p class='text-xl text-red-600'>-{ formatCurrency(bank.spent) } Spent</p>
    <p class='text-xl text-orange-500'>-{ formatCurrency(bank.pending) } En-Route</p>
    <p class='text-xl text-yellow-600'>-{ formatCurrency(bank.review) } Requested</p>
    <br>
    <p class='text-2xl'>{ formatCurrency(bank.available) }</p>
</div>
{/snippet}



