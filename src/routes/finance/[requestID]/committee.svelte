


<script lang='ts'>
    import * as Tabs from "$lib/components/tabs";
    import * as NativeSelect from "$lib/components/native-select";
    import type { PurchaseRequest } from "$lib/data/procurement.svelte";
    import type { Proposal } from "$lib/data/procurement.svelte";

    let { request = $bindable() as PurchaseRequest } = $props();
    let { proposals } = $derived(request);
    let sorted = $derived(proposals.toSorted((a, b) => new Date(b.submitted).getTime() - new Date(a.submitted).getTime()));

    let currentID = $state<string>(sorted[0].id ?? '');
    let current = $derived(sorted.find((p) => p.id === currentID));
</script>



<Tabs.Content value="committee" class='grid grid-cols-5 gap-8 pt-24 px-[5vw]'>
{#if proposals.length === 0 }
    <section class='col-span-5 text-center py-12'>
        <p class='text-muted-foreground text-lg'>No proposals submitted to committee.</p>
    </section>
{:else }
    <section class='space-y-4'>
        <br>
        <h4 class='font-medium'>Drafts</h4>
        {#each sorted as info (info.id)}
            {@render ProposalCard(info)}
        {/each}
    </section>

    <article id='proposal' class='bg-background shadow-accent-foreground col-span-3 shadow/16 m-4 px-[3vw] py-12'>
    {#if current}
    <h2 class='font-medium text-4xl'>{ current.purpose }</h2>
    <p class='text-base grid grid-cols-3 mt-6'>
        <span class='font-medium'>Submitted By</span> <span class='font-medium'>Updated</span> <span class='font-medium'>Due</span>
        <span>{ current.requester }</span><span>{ new Date(current.submitted).toLocaleDateString() }</span><span>Nov 30, 2026</span>
    </p>



    <br>
    <p class='font-medium mb-2 text-lg'>Details</p>
    <p class='text-base text-foreground/70 outline-0' contenteditable='true'>{ current.details }</p>
    {/if} 
    </article>


    <section class='space-y-4'>
        <br>
        <h4 class='font-medium'>Committee</h4>
        {#each current?.committee ?? [] as person (person.email) }
            {@render CommitteeCard(person)}
        {/each}
    </section>
{/if}
</Tabs.Content>


{#snippet CommitteeCard({ name, email, vote }: any)}
<div class='bg-background py-2 px-3 border'>
    <h3 class='font-medium line-clamp-1'>{name}</h3>
    <p  class='text-muted-foreground line-clamp-2'>{email}</p>
    <p  class='text-muted-foreground line-clamp-2'>{vote}</p>
</div>
{/snippet}


{#snippet ProposalCard({ id, purpose, details }: Proposal)}
<button onclick={ () => currentID = id } data-active={currentID === id} class='cursor-pointer w-full bg-background py-2 px-3 border border-muted text-start data-active:border-orange-400'>
    <h3 class='font-medium line-clamp-1'>{purpose}</h3>
    <p  class='text-muted-foreground h-10 line-clamp-2'>{details}</p>
</button>
{/snippet}

