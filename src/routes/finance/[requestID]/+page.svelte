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
<Tabs.Root value="proposal" class=''>
    <div class='fixed top-0 left-0 w-screen h-16 bg-linear-180 from-background via-background to-background/30 z-10'></div>

    <Tabs.List class='fixed top-0 left-1/2 -translate-x-1/2 my-4 z-40 bg-transparent gap-1 grid grid-cols-4 p-0'>
        <Tabs.Trigger class='h-7 rounded-none' value="proposal">Proposal</Tabs.Trigger>
        <Tabs.Trigger class='h-7 rounded-none' value="committee">Committee</Tabs.Trigger>
        <Tabs.Trigger class='h-7 rounded-none' value="vendors">Vendors</Tabs.Trigger>
        <Tabs.Trigger class='h-7 rounded-none' value="procurement">Procurement</Tabs.Trigger>
    </Tabs.List>


    <Proposal />
    <Committee />
    <Vendors />
    <Procurement />
</Tabs.Root>
{/if}





