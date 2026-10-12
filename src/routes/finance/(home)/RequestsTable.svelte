
<script lang='ts'>
    import { createTable, FlexRender } from '@tanstack/svelte-table';
    import { untrack } from 'svelte';
    import * as Table from '$lib/components/table';
    import * as Pagination from '$lib/components/pagination';
    import { database } from '$lib/data/smartsheet.svelte';
    import { columns, features, initialSorting } from './columns';
    import RequestRow from './RequestRow.svelte';

    let { startDate, endDate }: { startDate?: string; endDate?: string } = $props();
    const requests = $derived(database.requests.filter((request) =>
        (!startDate || request.updated_at >= startDate) &&
        (!endDate || request.updated_at <= endDate)
    ));

    const PAGE_SIZE = 20;
    const table = createTable({
        features,
        columns,
        get data() { return requests; }, // latest draft of each request within the date range
        initialState: {
            pagination: { pageIndex: 0, pageSize: PAGE_SIZE },
            sorting: initialSorting
        }
    });

    $effect(() => {
        // Track the bounds so narrowing or clearing a range returns to page one.
        void startDate;
        void endDate;
        untrack(() => table.setPageIndex(0));
    });

    // "1–20 of 63"
    const pagination = $derived(table.atoms.pagination.get());
    const total = $derived(table.getRowCount());
    const first = $derived(total ? pagination.pageIndex * pagination.pageSize + 1 : 0);
    const last = $derived(Math.min(pagination.pageIndex * pagination.pageSize + pagination.pageSize, total));
</script>

<Table.Root class='border'>
    <Table.Header>
        {#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
            <Table.Row class='py-1 bg-muted'>
                {#each headerGroup.headers as header (header.id)}
                    <Table.Head class={header.column.columnDef.meta?.headClass}>
                        {#if !header.isPlaceholder}
                            <FlexRender {header} />
                        {/if}
                    </Table.Head>
                {/each}
            </Table.Row>
        {/each}
    </Table.Header>

    <Table.Body>
        {#each table.getRowModel().rows as row (row.id)}
            <RequestRow {row} />
        {:else}
            <Table.Row>
                <Table.Cell colspan={columns.length} class='h-24 text-center'>
                    {startDate || endDate ? 'No requests match this date range.' : 'No proposals.'}
                </Table.Cell>
            </Table.Row>
        {/each}
    </Table.Body>
</Table.Root>

<div class='flex items-center justify-between mt-8 pb-4'>
    <p class='text-sm text-muted-foreground whitespace-nowrap'>{ first }–{ last } of { total }</p>

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
                    <Pagination.Item>
                        {#if page.type === 'ellipsis'}
                            <Pagination.Ellipsis />
                        {:else}
                            <Pagination.Link {page} isActive={currentPage === page.value} />
                        {/if}
                    </Pagination.Item>
                {/each}
                <Pagination.Item><Pagination.Next /></Pagination.Item>
            </Pagination.Content>
        {/snippet}
    </Pagination.Root>
</div>
