<script lang='ts'>

    import { bank } from "$lib/data/bank.svelte";
    import { page } from "$app/state";
    import { type PurchaseRequest } from "$lib/data/procurement.svelte";
    import { Microscope, Layers, ScanSquare, ArrowLeft, ArrowRight } from "@lucide/svelte";
    import * as Tabs from "$lib/components/tabs";
    import Proposal from "./proposal.svelte";
    import Committee from "./committee.svelte";
    import Vendors from "./vendors.svelte";
    import Procurement from "./procurement.svelte";


    let { requestID } = $derived(page.params);
    let request: PurchaseRequest | undefined = $derived(bank.purchaseRequests[requestID ?? '']);
</script>


{#if !request }
    <br>
    <br>
    <br>
    <h1>Request not found</h1>
{:else}
<Tabs.Root value="proposal" class='border border-orange-400'>
    <Tabs.List class='fixed top-0 left-1/2 -translate-x-1/2 my-4 bg-transparent gap-2 grid grid-cols-4 p-0'>
        <Tabs.Trigger value="proposal">Proposal</Tabs.Trigger>
        <Tabs.Trigger value="committee">Committee</Tabs.Trigger>
        <Tabs.Trigger value="vendors">Vendors</Tabs.Trigger>
        <Tabs.Trigger value="procurement">Procurement</Tabs.Trigger>
    </Tabs.List>


    <Proposal />
    <Committee />
    <Vendors />
    <Procurement />
</Tabs.Root>
{/if}





