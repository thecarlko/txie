
<script lang="ts">
    import { Banknote, Cpu, DraftingCompass, Pickaxe, Stone } from '@lucide/svelte';
    import type { Component } from 'svelte';
    
    type Department = { url: string; title: string; icon: Component }
    const departments: Department[] = [
        { url: '/finance', title: 'Finance', icon: Banknote },
        { url: 'https://coa-tracker-xi.vercel.app/', title: 'Materials', icon: Stone },
        { url: '/engineering', title: 'Engineering', icon: Cpu },
        { url: '/metrology', title: 'Metrology', icon: DraftingCompass },
        { url: '/equipment', title: 'Equipment', icon: Pickaxe },
    ]

</script>



<section class='h-screen flex flex-col pt-[6vw]'>
    <article class='w-full max-w-8xl mx-auto px-[3vw]'>
        <img class='size-16 pr-3' src='brand/icon.svg' alt="Texas Institute for Electronics" /> 
        <br>
        <h1 class="bg-linear-to-br from-foreground to-zinc-400 bg-clip-text text-balance text-transparent">
        <span class='text-3xl/loose font-medium'>Texas Institute for Electronics</span><br>
        <span class="text-6xl font-display font-medium bg-clip-text bg-linear-to-br from-[hsl(24,84%,87%)] to-[hsl(21,28%,51%)]">Fab Engineering </span><br>
        </h1>
    </article>
    <br>
    <br>
    <br>

    <article class='w-full max-w-8xl mx-auto px-[3vw] gap-4 grid grid-cols-[repeat(auto-fill,minmax(400px,1fr))]'>
        {#each departments as info}
        {@render departmentCard(info)}
        {/each}
    </article>
</section>



{#snippet departmentCard(info: Department)}
{@const { url, title, icon: Icon } = info}
<a href={ url } class='border bg-background flex flex-col justify-end gap-2 p-4'>
    <Icon class='size-6 stroke-1' />
    <p class='font-medium'>{ title }</p>
</a>
{/snippet}





