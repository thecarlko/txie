

<script lang='ts'>
    import * as Table from "$lib/components/table";
    import { createColumnHelper } from "@tanstack/svelte-table";
    import type { DataTableFeatures } from "../table-features.ts";
    import { transactions, type Transaction } from "$lib/data/transactions.svelte";

    const columnHelper = createColumnHelper<DataTableFeatures, Transaction>();
</script>


<Table.Root class='border'>
    <Table.Header class='bg-muted'>
        <Table.Row>
        <Table.Head class="w-25">ID</Table.Head>
        <Table.Head>Status</Table.Head>
        <Table.Head>Vendor</Table.Head>
        <Table.Head>Description</Table.Head>
        <Table.Head class="text-end">Amount</Table.Head>
        </Table.Row>
    </Table.Header>

    <Table.Body>
    {#each transactions as info}
        {@render Transaction(info)}
    {/each}
    </Table.Body>
</Table.Root>


<!-- Row representing a single transaction -->
{#snippet Transaction(info: Transaction)}
{@const { invoice, status, vendor, description, amount } = info}
<Table.Row>
    <Table.Cell class="font-medium uppercase">{ invoice }</Table.Cell>
    <Table.Cell class='capitalize'>{ status }</Table.Cell>
    <Table.Cell class='capitalize'>{ vendor }</Table.Cell>
    <Table.Cell class='capitalize'>{ description }</Table.Cell>
    <Table.Cell class="text-end">${ amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }</Table.Cell>
</Table.Row>
{/snippet}


