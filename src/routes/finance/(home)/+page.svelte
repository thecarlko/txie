<script lang='ts'>
    import { Hourglass, Landmark, Lock, Plus, Wallet } from '@lucide/svelte';
    import { DateFormatter, getLocalTimeZone, today } from '@internationalized/date';
    import type { DateRange } from 'bits-ui';
    import { formatCurrency } from '$lib/hooks/finance';
    import { bank } from '$lib/data/bank.svelte';
    import { Sankey } from '$lib/components/sankey';
    import * as Tabs from '$lib/components/tabs';
    import Button from '$lib/components/button/button.svelte';
    import * as Popover from '$lib/components/popover';
    import { RangeCalendar } from '$lib/components/range-calendar';
    import { goto } from '$app/navigation';
    import { database } from '$lib/data/smartsheet.svelte';
    import RequestsTable from './RequestsTable.svelte';

    let dateRange = $state<DateRange | undefined>();
    let datePickerOpen = $state(false);
    const dateFormatter = new DateFormatter('en-US', { dateStyle: 'medium' });
    const startDate = $derived(dateRange?.end ? dateRange.start?.toString() : undefined);
    const endDate = $derived(dateRange?.start ? dateRange.end?.toString() : undefined);

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

        <div class='ml-auto flex items-center gap-2'>
            <Popover.Root bind:open={datePickerOpen}>
                <Popover.Trigger aria-label='Filter requests by updated date range'>
                    {#snippet child({ props })}
                        <Button {...props} variant='outline' class='rounded-none justify-start font-normal'>
                            <span>
                                {#if dateRange?.start && dateRange.end}
                                    {dateFormatter.format(dateRange.start.toDate(getLocalTimeZone()))}
                                    – {dateFormatter.format(dateRange.end.toDate(getLocalTimeZone()))}
                                {:else}
                                    Filter by Date
                                {/if}
                            </span>
                        </Button>
                    {/snippet}
                </Popover.Trigger>
                <Popover.Content align='end' class='w-auto gap-0 p-0 rounded-none [&_*]:rounded-none!'>
                    <RangeCalendar
                        bind:value={dateRange}
                        maxValue={today(getLocalTimeZone())}
                        class='rounded-none [--cell-radius:0px]'
                        aria-label='Updated date range'
                        onValueChange={(value) => {
                            if (value?.start && value.end) datePickerOpen = false;
                        }}
                    />
                    <div class='flex justify-center border-t p-2'>
                        <Button
                            variant='ghost'
                            class='rounded-none'
                            disabled={!dateRange?.start && !dateRange?.end}
                            onclick={() => { dateRange = undefined; }}
                        >
                            Clear
                        </Button>
                    </div>
                </Popover.Content>
            </Popover.Root>
        </div>
    </div>
    <br>
    <br>

    <RequestsTable {startDate} {endDate} />
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
            {@render Deduction(Lock, 'FAB Approved', bank.approved, 'text-orange-500')}
            {@render Deduction(Hourglass, 'Requested', bank.requested, 'text-yellow-600')}
        </dl>

        <hr class='w-full max-w-72 pt-4'>
        <span class='flex items-center gap-1.5 text-sm text-muted-foreground'><Wallet class='size-4' /> Available</span>
        <p class={['text-2xl font-medium', bank.available < 0 && 'text-red-600']}>{ formatCurrency(bank.available / 100) }</p>
    </div>
{/snippet}

{#snippet Deduction(Icon: typeof Lock, label: string, cents: number, color: string)}
    <Icon class={['size-4', color]} />
    <dt class='text-sm text-muted-foreground text-left'>{label}</dt>
    <dd class={color}>-{ formatCurrency(cents / 100) }</dd>
{/snippet}
