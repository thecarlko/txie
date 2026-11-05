<script lang='ts'>
    import sample from '$lib/json/spc-sample.json';
    import TrendChart from '$lib/components/spc/trend-chart.svelte';
    import { FileDown, RefreshCw, ScreenShare } from '@lucide/svelte';

    const tools = sample.tools;
    let selected = $state(tools[0].name);
    const tool = $derived(tools.find(({ name }) => name === selected)!);

    const fmt = (d?: string | null) =>
        d ? new Date(`${d}T00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—';

    type Tool = (typeof tools)[number];
    type Point = { value: number; lowerSpec: number | null; upperSpec: number | null };

    const isOutOfSpec = ({ value, lowerSpec, upperSpec }: Point) =>
        (upperSpec !== null && value > upperSpec) || (lowerSpec !== null && value < lowerSpec);

    const secondary =
        'flex w-fit items-center gap-2 border border-brand-500 bg-transparent px-4 py-2 text-sm font-medium text-brand-600 transition-colors hover:border-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500';

    const describe = ({ charts, refresh }: Pick<Tool, 'charts' | 'refresh'>) => {
        const oos = charts.flatMap(({ points }): Point[] => points).filter(isOutOfSpec).length;
        return [
            `Last measured ${fmt(refresh?.lastMeasuredDate)}`,
            `${charts.length} chart${charts.length === 1 ? '' : 's'}`,
            `refresh ${refresh?.status ?? 'unknown'}`,
            `${oos} out of spec`,
        ].join(' · ');
    };
</script>

<section class='grid gap-16 pb-32 md:grid-cols-[5fr_7fr] md:gap-24'>
    <div class='grid content-start gap-6 md:sticky md:top-[20vh]'>
        <div class='flex flex-wrap gap-3'>
            <button type='button' class='group flex w-fit items-center gap-2 bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500'>
                <RefreshCw class='size-4 transition-transform duration-500 group-hover:rotate-180' strokeWidth={1.5} />
                Re-Run SPC
            </button>
            <button type='button' class={secondary}>
                <FileDown class='size-4' strokeWidth={1.5} />
                Download SPC Data
            </button>
            <button type='button' class={secondary}>
                <ScreenShare class='size-4' strokeWidth={1.5} />
                Forward to MES
            </button>
        </div>
        <ul class='grid content-start gap-1' aria-label='Tools'>
        {#each tools as { name, charts, refresh }, i (name)}
            <li>
                <label class='grid cursor-pointer grid-cols-[auto_1fr] grid-rows-[auto_0fr] gap-x-4 border-l-2 border-transparent px-5 py-3 text-muted-foreground transition-all duration-500 has-checked:grid-rows-[auto_1fr] has-checked:border-brand-500 has-checked:bg-brand-50 dark:has-checked:bg-brand-950/40 has-checked:text-foreground has-focus-visible:outline-2 has-focus-visible:outline-offset-4 has-focus-visible:outline-ring'>
                    <input type='radio' name='tool' value={name} bind:group={selected} class='sr-only' />
                    <span class='pt-1.5 font-mono text-xs text-muted-foreground'>{String(i + 1).padStart(2, '0')}</span>
                    <span class='font-sans text-[clamp(1rem,1.6vw,1.5rem)] leading-none tracking-[-0.04em]'>{name}</span>
                    <small class='col-start-2 overflow-hidden text-sm text-muted-foreground opacity-0 transition-opacity duration-500 [label:has(:checked)_&]:opacity-100 [label:has(:checked)_&]:pt-1.5'>{describe({ charts, refresh })}</small>
                </label>
            </li>
        {/each}
        </ul>
    </div>

    <aside class='grid content-start gap-10' aria-label='{selected} charts'>
    {#each tool.charts as { id, title, points } (id)}
        <TrendChart {title} {points} />
    {:else}
        <p class='text-muted-foreground'>No charts for {selected}.</p>
    {/each}
    </aside>
</section>
