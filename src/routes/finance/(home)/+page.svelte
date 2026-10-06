<script lang='ts'>
    import { Plus } from '@lucide/svelte';
    import { formatCurrency } from '$lib/hooks/finance';
    import { bank } from '$lib/data/bank.svelte';
    import { Sankey } from '$lib/components/sankey';
    import * as Tabs from '$lib/components/tabs';
    import Button from '$lib/components/button/button.svelte';
    import { DatePicker } from '$lib/components/date-picker';
    import { goto } from '$app/navigation';
    import { database } from '$lib/data/smartsheet.svelte';
    import RequestsTable from './RequestsTable.svelte';

    /** Opens a fresh version 1 draft for editing. */
    function createNewPurchaseRequest() {
        const snapshot = database.create();
        goto(`/finance/${snapshot.request_id}`);
    }
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
    <br>

    <div class='grid grid-cols-3 gap-4 items-end'>
        <Tabs.Root value='contracts' class='w-72'>
            <Tabs.List variant='line' class='w-full'>
                <Tabs.Trigger value='contracts'>Purchase Requests</Tabs.Trigger>
                <Tabs.Trigger value='transactions'>Transactions</Tabs.Trigger>
            </Tabs.List>
        </Tabs.Root>

        <Button onclick={createNewPurchaseRequest} class='w-max mx-auto rounded-none pr-4'>
            <Plus />New Purchase Request
        </Button>

        <div class='ml-auto flex gap-2'>
            <DatePicker />
            <DatePicker />
        </div>
    </div>
    <br>
    <br>

    <RequestsTable />
    <br>
    <br>
    <br>
</section>


{#snippet SankeyOverview()}
    <div class='col-span-2'>
        <Sankey />
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
