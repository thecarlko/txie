<script lang="ts">
    import Badge from '$lib/components/badge/badge.svelte';
    import * as Table from '$lib/components/table';
    import materials from './materials.json';

    const typeLabels: Record<string, string> = {
        wet_chemical: 'Wet Chemical',
        coating: 'Coating',
        resin: 'Resin',
    };
</script>

<Table.Root class='border'>
    <Table.Header>
        <Table.Row class='py-1 bg-muted'>
            <Table.Head class="w-[100px]">ID</Table.Head>
            <Table.Head>Name</Table.Head>
            <Table.Head>Code</Table.Head>
            <Table.Head>Status</Table.Head>
            <Table.Head>Type</Table.Head>
        </Table.Row>
    </Table.Header>
    <Table.Body>
        {#each materials as material (material.id)}
            <Table.Row class='text-foreground/80 hover:*:bg-muted/50 transition-all'>
                <Table.Cell class="font-medium"><a href={`/materials/${material.id}`}>{material.id}</a></Table.Cell>
                <Table.Cell>{material.name}</Table.Cell>
                <Table.Cell>{material.code}</Table.Cell>
                {@render StatusCell(material.status)}
                <Table.Cell>{typeLabels[material.type] ?? material.type}</Table.Cell>
            </Table.Row>
        {/each}
    </Table.Body>
</Table.Root>


{#snippet StatusCell(status: string)}
    <Table.Cell>
        <Badge class='capitalize' variant={ status == 'in_spec' ? 'default' : 'destructive' }>{status.split('_').join(' ')}</Badge>
    </Table.Cell>
{/snippet}
