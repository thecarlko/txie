<script lang='ts'>
    let { children } = $props();
    let filter = $state<'equipment' | 'wafers'>('equipment');

    const filters = [
        { value: 'equipment', label: 'Equipment' },
        { value: 'wafers', label: 'Wafers' },
    ] as const;

    const labels: Record<string, HTMLLabelElement> = $state({});
    const active = $derived(labels[filter]);
</script>

<section class='max-w-8xl mx-auto pt-[calc(4vw+7rem)] px-[3vw]'>
    <fieldset aria-label='Metrology filter' class='sticky top-[calc(4vw+7rem)] z-40 mb-16 flex w-fit gap-[3vw] border-b border-txie-rule pb-3 font-sans text-[clamp(1.25rem,3.5vw,3rem)]/[1.05] font-light tracking-tight'>
        {#each filters as { value, label } (value)}
            <label bind:this={labels[value]} class='w-fit cursor-pointer text-txie-mark/60 transition-colors duration-150 ease-out hover:text-txie-secondary has-checked:text-txie-ink has-focus-visible:outline-2 has-focus-visible:outline-offset-4 has-focus-visible:outline-brand-500'>
                <input type='radio' name='filter' {value} bind:group={filter} class='sr-only' />{label}
            </label>
        {/each}
        {#if active}
            <span aria-hidden='true' class='absolute -bottom-px left-0 h-0.5 bg-brand-500 transition-[translate,width] duration-250 ease-out motion-reduce:transition-none'
                style:width='{active.offsetWidth}px' style:translate='{active.offsetLeft}px 0'></span>
        {/if}
    </fieldset>

    {@render children()}
</section>
