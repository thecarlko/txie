

<script lang='ts'>
    import Proposal from './proposal.svelte'
    import Vendors from './vendors.svelte'
    import Leadership from './leadership.svelte';

    import * as Tabs from "$lib/components/tabs";
    import Button from '$lib/components/button/button.svelte';
    import { ArrowRight } from "@lucide/svelte";

    let tab = $state("proposal");

    async function submitProposal() {
        
    }
</script>


<Tabs.Root bind:value={tab}>
    <Proposal />
    <Leadership />
    <Vendors />
    
    <div class='fixed top-0 w-screen pb-5 pt-3 px-6 flex justify-center bg-background'>
        <Tabs.List variant='line' class='gap-x-4'>
            <Tabs.Trigger value="proposal" class='after:bg-transparent'>Proposal</Tabs.Trigger>
            <Tabs.Trigger value="leadership" class='after:bg-transparent font-base'>Leadership</Tabs.Trigger>
            <Tabs.Trigger value="vendors" class='after:bg-transparent'>Vendors</Tabs.Trigger>
        </Tabs.List>

        <div class='ml-auto hidden gap-4 items-center grid-cols-[auto_auto]'>
            <Button variant='secondary' class='px-4'>Return</Button>

            <Button onclick={() => submitProposal()} disabled={ false } variant='default' class='ml-auto flex items-center gap-3 pl-4'>Submit to FAB Leadership <ArrowRight class='stroke-2' /></Button>
        </div>
    </div>
</Tabs.Root>










