

<script lang='ts'>
    let { children } = $props();
    let filter = $state<'equipment' | 'wafers'>('equipment');

    const filters = [
        { value: 'equipment', label: 'Equipment' },
        { value: 'wafers', label: 'Wafers' },
    ] as const;
</script>

<section class='max-w-8xl mx-auto pt-[calc(4vw+7rem)] px-[3vw]'>
    <fieldset aria-label='Metrology filter' class='mb-16 flex gap-8 font-sans text-[clamp(1.25rem,3.5vw,3rem)] leading-[1.05] font-normal tracking-[-0.055em]'>
        {#each filters as { value, label } (value)}
            <label class='block w-fit cursor-pointer text-muted-foreground has-checked:font-medium has-checked:text-foreground has-focus-visible:outline-2 has-focus-visible:outline-offset-4 has-focus-visible:outline-ring'>
                <input type='radio' name='filter' value={value} bind:group={filter} class='sr-only' />{label}
            </label>
        {/each}
    </fieldset>



    {@render children()}

</section>  
