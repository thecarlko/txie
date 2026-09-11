
<script lang="ts">
    import { Banknote, Cpu, DraftingCompass, Pickaxe } from '@lucide/svelte';
    import type { Component } from 'svelte';
    import Button from "$lib/components/button/button.svelte";
    import { Icon } from 'svelte-sonner';
    
    type Department = { id: string; title: string; icon: Component }
    const departments: Department[] = [
        { id: 'finance', title: 'Finance', icon: Banknote },
        { id: 'engineering', title: 'Engineering', icon: Cpu },
        { id: 'metrology', title: 'Metrology', icon: DraftingCompass }
    ]

</script>



<section class='h-screen flex flex-col pt-[6vw]'>

    <article class='w-full max-w-8xl mx-auto px-[3vw]'>
    <h1 class="bg-linear-to-br from-foreground to-zinc-400 bg-clip-text text-balance text-transparent">
        <span class='text-3xl/loose font-medium'>Fab Engineering</span><br>
        <span class="text-7xl font-medium bg-clip-text bg-linear-to-br from-[hsl(24,84%,87%)] to-[hsl(21,28%,51%)]">Texas Institute for Electronics</span><br>
    </h1>
    </article>
    <br>
    <br>

    <article class='w-full max-w-8xl mx-auto px-[3vw] gap-4 grid grid-cols-[repeat(auto-fill,minmax(400px,1fr))]'>
        {#each departments as info}
        {@render departmentCard(info)}
        {/each}
    </article>
</section>



{#snippet departmentCard(info: Department)}
{@const { id, title, icon: Icon } = info}
<a href='/{ id }' class='border bg-background flex flex-col justify-end gap-2 p-4'>
    <Icon class='size-6 stroke-1' />
    <p class='font-medium'>{ title }</p>
</a>
{/snippet}





