<script lang='ts'>
    import type { Column } from '@tanstack/svelte-table';
    import type { PurchaseSnapshot } from '$lib/models/procurement';
    import { ArrowDown, ArrowUp, ArrowUpDown } from '@lucide/svelte';
    import Button from '$lib/components/button/button.svelte';
    import type { RequestFeatures } from '../columns';

    let { column, label }: { column: Column<RequestFeatures, PurchaseSnapshot, any>; label: string } = $props();
    const sorted = $derived(column.getIsSorted());
</script>

<Button variant='ghost' size='sm' class='-ml-2 h-8 font-medium' onclick={column.getToggleSortingHandler()}>
    { label }
    {#if sorted === 'asc'}
        <ArrowUp />
    {:else if sorted === 'desc'}
        <ArrowDown />
    {:else}
        <ArrowUpDown class='opacity-50' />
    {/if}
</Button>
