

<script lang='ts'>
    import { formatCurrency } from '$lib/hooks/finance';
    import { Sankey } from '$lib/components/sankey'
    import { bank } from '$lib/data/bank.svelte';
    import * as Tabs from "$lib/components/tabs";
    import * as Table from "$lib/components/table";
    import Button from '$lib/components/button/button.svelte';
    import { Plus } from '@lucide/svelte';
    import { type CalendarDate } from "@internationalized/date";
    import { DatePicker } from '$lib/components/date-picker';
    import { generateID } from '$lib/hooks/hash';
    import { goto } from '$app/navigation';
    import type { PurchaseRequest, PurchaseSnapshot } from '$lib/models/procurement';
    import { createPurchaseRequest, database } from '$lib/data/procurement.svelte';

    let start = $state<CalendarDate | undefined>();
    let end = $state<CalendarDate | undefined>();

    async function createNewPurchaseRequest() {
        const id = createPurchaseRequest();
        goto(`/finance/${ id }`);
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
        <Tabs.Root value="contracts" class='w-72'>
        <Tabs.List variant='line' class='w-full'>
            <Tabs.Trigger value="contracts">Contracts</Tabs.Trigger>
            <Tabs.Trigger value="transactions">Transactions</Tabs.Trigger>
        </Tabs.List>
        </Tabs.Root>

        <Button onclick={ createNewPurchaseRequest } class='w-max mx-auto rounded-none pr-4'><Plus />New Purchase Request</Button>

        <div class='ml-auto flex gap-2'>
            <DatePicker/>
            <DatePicker />
        </div>
    </div>
    <br>
    <br>

    
</section>

<!-- Row representing a single PurchaseRequest -->
<!-- {#snippet ContractRow(info: PurchaseRequest, index: number)}
{@const { contact, email, approval, purpose, details, purchase, fitup, misc, targetDate } = info }
{@const estimate = purchase + fitup + misc }
<Table.Row>
    <Table.Cell class="hover:bg-muted/50 font-medium text-center"><ChevronsLeftRight class='-rotate-45 stroke-1 transition-all hover:scale-110' /></Table.Cell>
    <Table.Cell class="hover:bg-muted/50 font-medium">{ contact }</Table.Cell>
    <Table.Cell class='hover:bg-muted/50'>{ email }</Table.Cell>
    {@render ApprovalCell(approval)}
    <Table.Cell class='hover:bg-muted/50'>{ purpose }</Table.Cell>
    <Table.Cell class='text-muted-foreground'>{ details }</Table.Cell>
    <Table.Cell class="hover:bg-muted/50 text-end">{ targetDate }</Table.Cell>
</Table.Row>
{/snippet} -->

<!--

    

    <Table.Root class='border'>
        <Table.Header class='bg-muted'>
            <Table.Row>
                <Table.Head class="w-8"></Table.Head>
                <Table.Head class="w-25"><UserRound class='stroke-2 size-5 ' /></Table.Head>
                <Table.Head>Email</Table.Head>
                <Table.Head>Status</Table.Head>
                <Table.Head>Purpose</Table.Head>
                <Table.Head class='border'>Details</Table.Head>
                <Table.Head class="text-end">Target Date</Table.Head>
            </Table.Row>
        </Table.Header>

        <Table.Body>
        {#each procurement.contracts as info, index }
            {@render ContractRow(info, index)}
        {/each}
        </Table.Body>
    </Table.Root>

-->


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

{#snippet ApprovalCell(approval: string)}
{#if approval === 'pending'}
    <Table.Cell class='text-orange-500'>Pending</Table.Cell>
{:else if approval === 'approved'}
    <Table.Cell class='text-green-500 hover:bg-muted/50'>Approved</Table.Cell>
{:else if approval === 'rejected'}
    <Table.Cell class='text-red-500 hover:bg-muted/50'>Rejected</Table.Cell>
{:else}
    <Table.Cell class='hover:bg-muted/50'>-</Table.Cell>
{/if}
{/snippet}



