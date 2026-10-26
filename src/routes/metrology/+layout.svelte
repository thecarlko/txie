

<script lang='ts'>
    let filter = $state<'tools' | 'equipment'>('tools');

    const filters = [
        { value: 'tools', label: 'Tools' },
        { value: 'equipment', label: 'Equipment' },
    ] as const;
</script>

<section class='max-w-8xl mx-auto pt-28 px-[3vw]'>
    <fieldset aria-label='Metrology filter' class='mb-16 grid gap-y-4 font-sans text-[clamp(1.62rem,4.86vw,4.32rem)] leading-[1.05] font-normal tracking-[-0.055em]'>
        {#each filters as option (option.value)}
            <label class='block w-fit cursor-pointer text-muted-foreground has-checked:font-medium has-checked:text-foreground has-focus-visible:outline-2 has-focus-visible:outline-offset-4 has-focus-visible:outline-ring'>
                <input type='radio' name='filter' value={option.value} bind:group={filter} class='sr-only' />{option.label}
            </label>
        {/each}
    </fieldset>



    <div class=' border-y py-2 my-2 bpr'></div>

</section>  
