<script lang='ts'>
    import { Hourglass, Landmark, Lock, Plus, Receipt, Wallet } from '@lucide/svelte';
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
    <div class='p-4 flex flex-col justify-end items-end text-right tabular-nums '>
        <span class='flex items-center gap-1.5 text-sm text-muted-foreground'><Landmark class='size-4' /> Account</span>
        <h1 class='text-3xl py-2 font-medium'>{ formatCurrency(bank.account / 100) }</h1>

        <dl class='grid grid-cols-[auto_auto_auto] items-center gap-x-2 gap-y-1 text-lg mt-auto py-4'>
            {@render Deduction(Receipt, 'Spent', bank.spent, 'text-red-600')}
            {@render Deduction(Lock, 'Committed', bank.committed, 'text-orange-500')}
            {@render Deduction(Hourglass, 'Requested', bank.requested, 'text-yellow-600')}
        </dl>

        <hr class='w-full max-w-72 pt-4'>
        <span class='flex items-center gap-1.5 text-sm text-muted-foreground'><Wallet class='size-4' /> Available</span>
        <p class={['text-2xl font-medium', bank.available < 0 && 'text-red-600']}>{ formatCurrency(bank.available / 100) }</p>
    </div>
{/snippet}

{#snippet Deduction(Icon: typeof Receipt, label: string, cents: number, color: string)}
    <Icon class={['size-4', color]} />
    <dt class='text-sm text-muted-foreground text-left'>{label}</dt>
    <dd class={color}>-{ formatCurrency(cents / 100) }</dd>
{/snippet}
