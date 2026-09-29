

<script lang='ts'>
    import { Badge } from '$lib/components/badge';
    import * as Avatar from "$lib/components/avatar"
    import { ArrowRight, ArrowUp } from "@lucide/svelte";
    import { Button } from "$lib/components/button";
    import * as Tabs from "$lib/components/tabs";

    function startLookingForVendors() {

    }

    function returnToProposal() {

    }
</script>


<Tabs.Content value="leadership" class='gap-x-0 grid grid-cols-1 md:grid-cols-2 px-[5vw] w-full mx-auto max-w-8xl'>
    <aside>
        <div class='md:sticky top-0 pt-20 space-y-4 md:h-screen md:pt-28 border'>
            <h1 class='text-2xl font-medium'>02 - Leadership</h1>
            
            
            <br>
        </div>
    </aside>

    <article class='md:pt-28'>
        <div class='space-y-4'>
            {@render Person("Pratik Joshi", "accepted")}
            {@render Person("Jonah Neff", "pending")}
            {@render Person("Sugento Huandra", "rejected")}
        </div>
        {@render Divider()}

        

        <div class='flex justify-end gap-4'>
            <Button onclick={() => returnToProposal()} variant='outline' class='flex items-center gap-3 pl-4'>Return to Proposal <ArrowUp class='stroke-2' /></Button>
            <Button onclick={() => startLookingForVendors()} variant='default' class='flex items-center gap-3'>Forward to Vendor Research <ArrowRight class='stroke-[1.5]' /></Button>
        </div>
    </article> 
</Tabs.Content>


{#snippet Summary()}
<article class='border border-dashed px-4 py-4 bg-muted'>
    <strong>Summary Order</strong>
</article>
{/snippet}


{#snippet Person(name: any, status: any)}
{@const initials = name.split(" ").map((n: string) => n.charAt(0)).join("")}
<div class='grid grid-cols-[max-content_1fr_max-content] gap-x-4 gap-y-0'>
    <Avatar.Root class='row-span-2 size-10 my-auto'><Avatar.Fallback>{ initials }</Avatar.Fallback></Avatar.Root>
    <strong class='capitalize'>{ name }</strong>

    {#if status == "accepted"}
        <Badge class='row-span-2 my-auto px-3 h-7 bg-green-50 text-green-500 border-green-500'>Accepted</Badge>
    {:else if status == "rejected"}
        <Badge class='row-span-2 my-auto px-3 h-7 bg-red-50 text-red-400 border-red-400'>Rejected</Badge>
    {:else}
        <Badge class='row-span-2 my-auto px-3 h-7 bg-gray-50 text-gray-400 border-gray-300'>Pending</Badge>
    {/if}

    <small class='text-muted-foreground'>{ name.toLowerCase().replace(' ', '_')}@txie.org</small>
</div>
{/snippet}

{#snippet Divider()}
    <br>
    <hr class='border-[0.5] border-dashed'>
    <br>
{/snippet}

