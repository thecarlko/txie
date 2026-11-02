<script lang='ts'>
    import TrendChart from '$lib/components/spc/trend-chart.svelte';
    import { RefreshCw } from '@lucide/svelte';
    import { slide } from 'svelte/transition';
    import { cubicOut } from 'svelte/easing';
    import { prefersReducedMotion } from 'svelte/motion';
    import { limitFor } from './spc/limits';
    import type { Series } from './spc/analysis';

    let { data } = $props();

    // Every tool with at least one analyzed series. Nothing here edits the data; it is only arranged for display.
    const tools = $derived(Object.entries(data.analysis).filter(([, series]) => series.length).map(([name, series]) => ({ name, series })));
    let selected = $state('');
    const tool = $derived(tools.find(({ name }) => name === selected) ?? tools[0]);

    const chart = ({ tool, series: { id, points } }: { tool: string; series: Series }) => {
        const { upper = null, lower = null } = limitFor(tool, id) ?? {};
        return points
            .map(({ date, value, file, cite, dateSource }) => ({ date, value, file, cite, dateSource, upperSpec: upper, lowerSpec: lower }))
            .toSorted((a, b) => +new Date(a.date) - +new Date(b.date));
    };

    const outside = (tool: string, { id, points }: Series) => {
        const { upper, lower } = limitFor(tool, id) ?? {};
        return points.filter(({ value }) => (upper !== undefined && value > upper) || (lower !== undefined && value < lower)).length;
    };

    // Group by the id prefix: DEF lot · table, MTH recipe · result, OVL test · axis, AOI metric family.
    const groups = (series: Series[]) => {
        const map = Map.groupBy(series.filter(({ legacy }) => !legacy), ({ id }) => {
            const parts = id.split(':');
            return parts.length > 2 ? parts.slice(0, 2).join(' · ') : parts.length > 1 ? parts[0] : 'Summary';
        });
        return [...map].map(([name, series]) => ({ name, series }));
    };

    const fmt = (d?: string) => (d ? new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—');

    const describe = (name: string, series: Series[]) => {
        const last = series.flatMap(({ points }) => points.map(({ date }) => date)).toSorted().at(-1);
        const oos = series.reduce((n, s) => n + outside(name, s), 0);
        return `Last measured ${fmt(last)} · ${series.length} charts · ${oos} outside limits`;
    };

    let open = $state<Record<string, boolean>>({});
    const motion = $derived(!prefersReducedMotion.current);
</script>

<svelte:head><title>Metrology · TxIE</title></svelte:head>

<section class='grid gap-16 pb-32 md:grid-cols-[5fr_7fr] md:gap-24'>
    <div class='grid content-start gap-6 md:sticky md:top-[calc(4vw+15rem)] md:self-start'>
        <button type='button' class='group flex w-fit items-center gap-2 bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500'>
            <RefreshCw class='size-4 transition-transform duration-500 group-hover:rotate-180' strokeWidth={1.5} />
            Re-Run SPC
        </button>
        <ul class='grid content-start gap-1' aria-label='Tools'>
        {#each tools as { name, series }, i (name)}
            <li>
                <label class='grid cursor-pointer grid-cols-[auto_1fr] grid-rows-[auto_0fr] gap-x-4 border-l-2 border-transparent px-5 py-3 text-muted-foreground transition-all duration-500 has-checked:grid-rows-[auto_1fr] has-checked:border-brand-500 has-checked:bg-brand-50 dark:has-checked:bg-brand-950/40 has-checked:text-foreground has-focus-visible:outline-2 has-focus-visible:outline-offset-4 has-focus-visible:outline-ring'>
                    <input type='radio' name='tool' value={name} checked={name === tool?.name} onchange={() => (selected = name)} class='sr-only' />
                    <span class='pt-1.5 font-mono text-xs text-muted-foreground'>{String(i + 1).padStart(2, '0')}</span>
                    <span class='font-sans text-[clamp(1rem,1.6vw,1.5rem)] leading-none tracking-[-0.04em]'>{name}</span>
                    <small class='col-start-2 overflow-hidden text-sm text-muted-foreground opacity-0 transition-opacity duration-500 [label:has(:checked)_&]:opacity-100 [label:has(:checked)_&]:pt-1.5'>{describe(name, series)}</small>
                </label>
            </li>
        {:else}
            <li class='text-muted-foreground'>No analysis yet. Run <code>bun run spc</code>.</li>
        {/each}
        </ul>
    </div>

    {#if tool}
    {@const { name, series } = tool}
    <aside class='grid content-start gap-10' aria-label='{name} charts'>
        {#each series.filter(({ legacy }) => legacy) as s (s.id)}
            <TrendChart title={s.title} points={chart({ tool: name, series: s })} />
        {/each}

        {#each groups(series) as group (`${name}:${group.name}`)}
        {@const key = `${name}:${group.name}`}
            <details bind:open={open[key]} class='group border-t border-border pt-4'>
                <summary class='flex cursor-pointer items-baseline justify-between text-sm text-foreground marker:content-none'>
                    {group.name}
                    <span class='font-mono text-xs text-muted-foreground tabular-nums'>{group.series.length}</span>
                </summary>
                {#if open[key]}
                <div in:slide={{ duration: motion ? 400 : 0, easing: cubicOut }} class='grid gap-10 pt-6'>
                    {#each group.series as s (s.id)}
                        <TrendChart title={s.title} points={chart({ tool: name, series: s })} />
                    {/each}
                </div>
                {/if}
            </details>
        {/each}
    </aside>
    {/if}
</section>
