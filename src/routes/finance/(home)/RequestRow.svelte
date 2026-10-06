<!-- One purchase request in the requests table -->
<script lang='ts'>
    import { FlexRender, type Row } from '@tanstack/svelte-table';
    import { goto } from '$app/navigation';
    import * as Table from '$lib/components/table';
    import type { PurchaseSnapshot } from '$lib/models/procurement';
    import type { RequestFeatures } from './columns';

    let { row }: { row: Row<RequestFeatures, PurchaseSnapshot> } = $props();
</script>

<Table.Row
    class='text-foreground/80 hover:*:bg-muted/50 transition-all cursor-pointer'
    onclick={() => goto(`/finance/${row.original.request_id}`)}
>
    {#each row.getAllCells() as cell (cell.id)}
        <Table.Cell class={cell.column.columnDef.meta?.cellClass}>
            <FlexRender {cell} />
        </Table.Cell>
    {/each}
</Table.Row>
