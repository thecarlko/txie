

<script lang='ts'>
    import { Badge } from '$lib/components/badge';
    import * as Avatar from "$lib/components/avatar"
    import { ArrowRight } from "@lucide/svelte";
    import { Button } from "$lib/components/button";

    function startLookingForVendors() {

    }
</script>



<section class='grid grid-cols-2'>
    <aside>
        <header class='sticky top-36'>
            <strong class='text-xl font-medium'>02 - FAB Leadership</strong>
        </header>
    </aside>

    <content class='space-y-4'>
        {@render Person("Pratik Joshi", "accepted")}
        {@render Person("Jonah Neff", "pending")}
        {@render Person("Sugento Huandra", "rejected")}
    </content>
</section>
<br>
<br>
<Button onclick={() => startLookingForVendors()} variant='default' class='ml-auto flex items-center gap-3 pl-4'>Forward to Vendor Research <ArrowRight class='stroke-[1.5]' /></Button>
<br>
<br>
<br>
<br>


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