

<script lang='ts'>
    import * as Tabs from '$lib/components/tabs';
    import { Plus, File } from '@lucide/svelte';
    import Button from '$lib/components/button/button.svelte';
    import { DatePicker } from '$lib/components/date-picker';
    import * as NativeSelect from '$lib/components/native-select';
    import MaterialTable from './MaterialTable.svelte';

    let view = $state('materials');
    let materialsFilter: 'all' | 'archived' = $state('all');

    async function createNewMaterial() {

    }
</script>


<section class='px-[5vw] w-full mx-auto max-w-8xl'>
    <br>
    <br>
    <br>
    <br>
    <br>

    <div class='grid grid-cols-3 gap-4'>
        <Tabs.Root bind:value={ view } class='w-72'>
            <Tabs.List variant='line' class='w-full'>
                <Tabs.Trigger value='materials'>Materials</Tabs.Trigger>
                <Tabs.Trigger value='coa'>Certificates of Analysis</Tabs.Trigger>
            </Tabs.List>
        </Tabs.Root>

        {#if view === 'materials'}
        <Button onclick={ createNewMaterial } class='w-max mx-auto rounded-none pr-4'><Plus />Add Material</Button>
        {:else}
        <Button onclick={ createNewMaterial } class='w-max mx-auto rounded-none pr-4'><File />Upload CoA</Button>
        {/if}

        <NativeSelect.Root bind:value={ materialsFilter } class='ml-auto'>
        <NativeSelect.Option value="all">All</NativeSelect.Option>
        <NativeSelect.Option value="active">Active</NativeSelect.Option>
        <NativeSelect.Option value="archived">Archived</NativeSelect.Option>
        </NativeSelect.Root>
    </div>
    <br>

    <MaterialTable />

</section>
