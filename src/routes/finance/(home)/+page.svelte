

<script lang='ts'>
    import { formatCurrency } from '$lib/hooks/finance';
    import { Sankey } from '$lib/components/sankey'
    import { bank } from '$lib/data/bank.svelte';
    import * as Tabs from "$lib/components/tabs";
    import * as Table from "$lib/components/table";
    import * as Pagination from "$lib/components/pagination";
    import {
        createTable,
        createColumnHelper,
        createPaginatedRowModel,
        rowPaginationFeature,
        tableFeatures,
        FlexRender,
        renderSnippet
    } from '@tanstack/svelte-table';
    import type { BudgetEntry, PersonnelEntry, PurchaseSnapshot, Stage } from '$lib/models/procurement';
    import Button from '$lib/components/button/button.svelte';
    import { ChevronsLeftRight, Plus } from '@lucide/svelte';
    import { type CalendarDate } from "@internationalized/date";
    import { DatePicker } from '$lib/components/date-picker';
    import { generateID } from '$lib/hooks/hash';
    import { goto } from '$app/navigation';

    let { data } = $props();
    let { proposals } = $derived(data);
    const currency = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD"
    });

    async function createNewPurchaseRequest() {}

    // Table
    const PAGE_SIZE = 20;
    const features = tableFeatures({
        rowPaginationFeature,
        paginatedRowModel: createPaginatedRowModel()
    });

    const columnHelper = createColumnHelper<typeof features, PurchaseSnapshot>();
    const columns = columnHelper.columns([
        columnHelper.display({ id: 'open', cell: () => renderSnippet(OpenCell) }),
        columnHelper.accessor('request_id', { header: 'ID' }),
        columnHelper.accessor('location', { header: 'Location' }),
        columnHelper.accessor('decision', { header: 'Decision', cell: ({ getValue }) => stageLabel[getValue()] }),
        columnHelper.accessor('purpose', { header: 'Purpose', cell: ({ getValue }) => renderSnippet(PurposeCell, getValue()) }),
        columnHelper.accessor(row => facultyName(row.personnel), { id: 'faculty', header: 'Faculty' }),
        columnHelper.accessor(row => budgetTotal(row.budget), {
            id: 'budget',
            header: 'Budget',
            cell: ({ getValue }) => { const total = getValue(); return total ? currency.format(total / 100) : 'Unset'; }
        })
    ]);

    // Extra classes per column id, applied to both header and body cells
    const headClass: Record<string, string> = { open: 'w-6', budget: 'text-end pr-5' };
    const cellClass: Record<string, string> = { open: 'font-medium text-center', request_id: 'font-medium', budget: 'text-end pr-5' };
    const stageLabel: Record<Stage, string> = {
        draft: 'Draft',
        fab_leadership_review: 'Leadership Review',
        rejected: 'Rejected',
        approved: 'Approved'
    };

    // Personnel is "name:email:role;..." — show the first listed person
    function facultyName(personnel: PurchaseSnapshot['personnel']) {
        const [entry] = (personnel?.split(';') ?? []) as PersonnelEntry[];
        return entry?.split(':')[0] ?? '—';
    }

    // Budget is "category-cents;..." (USD cents)
    function budgetTotal(budget: PurchaseSnapshot['budget']) {
        const entries = (budget?.split(';') ?? []) as BudgetEntry[];
        return entries.reduce((acc, entry) => acc + Number(entry.split('-')[1]), 0);
    }

    const table = createTable({
        features,
        columns,
        get data() { return proposals; },
        initialState: { pagination: { pageIndex: 0, pageSize: PAGE_SIZE } }
    });

    const pagination = $derived(table.atoms.pagination.get());
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
            <Tabs.Trigger value="contracts">Purchase Requests</Tabs.Trigger>
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

    {@render RequestTable()}
    <br>
    <br>
    <br>
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


<!-- Table -->
{#snippet RequestTable()}
<Table.Root class='border'>
    <Table.Header class=''>
    {#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
    <Table.Row class='py-1 bg-muted'>
        {#each headerGroup.headers as header (header.id)}
        <Table.Head class={headClass[header.column.id]}>
            {#if !header.isPlaceholder}<FlexRender {header} />{/if}
        </Table.Head>
        {/each}
    </Table.Row>
    {/each}
    </Table.Header>

    <Table.Body>
    {#each table.getRowModel().rows as row (row.id)}
    <Table.Row class='text-foreground/80 hover:*:bg-muted/50 transition-all cursor-pointer'>
        {#each row.getAllCells() as cell (cell.id)}
        <Table.Cell class={cellClass[cell.column.id]}><FlexRender {cell} /></Table.Cell>
        {/each}
    </Table.Row>
    {:else}
    <Table.Row>
        <Table.Cell colspan={columns.length} class='h-24 text-center'>No proposals.</Table.Cell>
    </Table.Row>
    {/each}
    </Table.Body>
</Table.Root>

{@const total = table.getRowCount()}
{@const first = pagination.pageIndex * pagination.pageSize}
<div class='flex items-center justify-between py-4'>
    <p class='text-sm text-muted-foreground whitespace-nowrap'>
        { total ? first + 1 : 0 }–{ Math.min(first + pagination.pageSize, total) } of { total }
    </p>

    <Pagination.Root
        count={total}
        perPage={pagination.pageSize}
        page={pagination.pageIndex + 1}
        onPageChange={(page) => table.setPageIndex(page - 1)}
        class='mx-0 w-auto'
    >
        {#snippet children({ pages, currentPage })}
        <Pagination.Content>
            <Pagination.Item><Pagination.Previous /></Pagination.Item>
            {#each pages as page (page.key)}
                {#if page.type === 'ellipsis'}
                <Pagination.Item><Pagination.Ellipsis /></Pagination.Item>
                {:else}
                <Pagination.Item><Pagination.Link {page} isActive={currentPage === page.value} /></Pagination.Item>
                {/if}
            {/each}
            <Pagination.Item><Pagination.Next /></Pagination.Item>
        </Pagination.Content>
        {/snippet}
    </Pagination.Root>
</div>
{/snippet}

{#snippet OpenCell()}
<ChevronsLeftRight class='-rotate-45 stroke-1 transition-all hover:scale-110' />
{/snippet}

{#snippet PurposeCell(purpose: string)}
<div class="max-w-56 truncate" title={purpose}>{ purpose }</div>
{/snippet}
