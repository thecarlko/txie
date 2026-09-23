

<script lang='ts'>
    import { Badge } from '$lib/components/badge';
    import * as Avatar from "$lib/components/avatar"

    let officials = $state([
		{ id: 'o1', name: 'James Patterson', avatarUrl: 'https://i.pravatar.cc/80?img=12', position: 'CC', status: 'accepted' },
		{ id: 'o2', name: 'Maria Rodriguez', avatarUrl: 'https://i.pravatar.cc/80?img=45', position: 'U1', status: 'accepted' },
		{ id: 'o3', name: 'Faheem Dinath', avatarUrl: 'https://i.pravatar.cc/80?img=59', position: 'U2', status: 'pending', isYou: true }
	]);

</script>



<section class='grid grid-cols-2'>
    <aside>
        <header class='sticky top-36'>
            <strong class='text-xl font-medium'>02 - Committee</strong>
        </header>
    </aside>

    <content class='space-y-4'>
        {@render Person("accepted")}
        {@render Person("")}
        {@render Person("rejected")}
    </content>
</section>
<br>
<br>
<br>
<br>


{#snippet Person(status: any)}
<div class='grid grid-cols-[max-content_1fr_max-content] gap-x-4 gap-y-0'>
    <Avatar.Root class='row-span-2 size-10 my-auto'><Avatar.Fallback>JP</Avatar.Fallback></Avatar.Root>
    <strong>James Patterson</strong>

    {#if status == "accepted"}
        <Badge class='row-span-2 my-auto px-3 h-7 bg-green-50 text-green-500 border-green-500'>Accepted</Badge>
    {:else if status == "rejected"}
        <Badge class='row-span-2 my-auto px-3 h-7 bg-red-50 text-red-400 border-red-400'>Rejected</Badge>
    {:else}
        <Badge class='row-span-2 my-auto px-3 h-7 bg-gray-50 text-gray-400 border-gray-300'>Pending</Badge>
    {/if}

    <small class='text-muted-foreground'>james_patterson@txie.org</small>
</div>
{/snippet}