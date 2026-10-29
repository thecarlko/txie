<script lang='ts'>
    import { LineChart, Points } from 'layerchart';
    import * as Chart from '$lib/components/chart';
    import { curveStepAfter } from 'd3-shape';
    import { CalendarDate, DateFormatter, fromDate, getLocalTimeZone, toCalendarDate, today } from '@internationalized/date';
    import type { DateRange } from 'bits-ui';
    import { Calendar } from '@lucide/svelte';
    import * as Popover from '$lib/components/popover';
    import { Day, RangeCalendar } from '$lib/components/range-calendar';

    type Point = { date: string; value: number; lowerSpec: number | null; upperSpec: number | null };
    let { title, points }: { title: string; points: Point[] } = $props();

    const zone = getLocalTimeZone();
    const now = new Date();
    const end = today(zone);
    const all = $derived(points.map((p) => ({ ...p, date: new Date(p.date) })));
    const earliest = $derived(all.length ? fromDate(all[0].date, zone) : end);
    const minDate = $derived(toCalendarDate(earliest).subtract({ days: 2 }));
    const earliestDay = $derived(new CalendarDate(earliest.year, earliest.month, earliest.day));

    const presets = $derived([
        ...[30, 90, 180].map((days) => ({ short: `${days}D`, label: `Last ${days} days`, start: end.subtract({ days }) })),
        { short: 'All', label: 'All time', start: earliestDay },
    ]);
    const initial = (): DateRange => {
        const start = end.subtract({ days: 90 });
        return { start: start.compare(minDate) < 0 ? earliestDay : start, end };
    };
    let range = $state<DateRange>(initial());
    let open = $state(false);

    const span = $derived({ start: range.start ?? end, end: range.end ?? range.start ?? end });
    const endsToday = $derived(span.end.compare(end) === 0);
    const label = $derived.by(() => {
        if (endsToday && span.start.compare(earliestDay) <= 0) return 'All time';
        const preset = presets.find(({ start }) => endsToday && start.compare(span.start) === 0);
        const medium = new DateFormatter('en-US', { dateStyle: 'medium' });
        return preset?.label ?? `${medium.format(span.start.toDate(zone))} – ${medium.format(span.end.toDate(zone))}`;
    });

    const measured = $derived.by(() => {
        const from = +span.start.toDate(zone);
        const to = +span.end.add({ days: 1 }).toDate(zone);
        return all.filter(({ date }) => +date >= from && +date < to);
    });
    // Carry the latest reading forward to today so the step line ends at today, only when the range ends today.
    const data = $derived(measured.length && endsToday ? [...measured, { ...measured.at(-1)!, date: now }] : measured);
    const outOfSpec = $derived(measured.filter((p) =>
        (p.upperSpec !== null && p.value > p.upperSpec) || (p.lowerSpec !== null && p.value < p.lowerSpec)));

    const lows = $derived(data.map(({ lowerSpec }) => lowerSpec).filter((v) => v !== null));
    const highs = $derived(data.map(({ upperSpec }) => upperSpec).filter((v) => v !== null));
    const yDomain = $derived.by(() => {
        if (!lows.length || !highs.length) return undefined;
        const values = data.map(({ value }) => value);
        const lower = Math.min(...lows, ...values);
        const upper = Math.max(...highs, ...values);
        const pad = (upper - lower) * 0.05;
        return [lower - pad, upper + pad];
    });

    const config = {
        value: { label: 'Value', color: 'var(--color-brand-500)' },
        upperSpec: { label: 'USL', color: 'var(--muted-foreground)' },
        lowerSpec: { label: 'LSL', color: 'var(--muted-foreground)' },
    } satisfies Chart.ChartConfig;

    const compact = new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 });

    const stamp = (d: Date) =>
        `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} @ ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(/\s/u, '')}`;

    const dashed = { props: { class: '[stroke-dasharray:4_4]' } };
</script>

{#snippet Controls()}
    <footer class='flex items-center justify-between border-t border-border px-3 py-2 font-mono text-xs tabular-nums'>
        <menu class='flex gap-1'>
            {#each presets as { short, label: text, start } (short)}
                <li><button type='button' disabled={start.compare(minDate) < 0} onclick={() => { range = { start, end }; open = false; }}
                    class='px-2 py-1 hover:bg-muted disabled:pointer-events-none disabled:opacity-40 {text === label ? "text-brand-500" : "text-muted-foreground hover:text-foreground"}'>{short}</button></li>
            {/each}
        </menu>
        <button type='button' onclick={() => (range = initial())} class='px-2 py-1 text-muted-foreground hover:bg-muted hover:text-foreground'>Reset</button>
    </footer>
{/snippet}

<figure class='border border-border bg-muted px-4 py-4 shadow-card ring-4 ring-border/40'>
    <figcaption class='grid grid-cols-[1fr_auto] items-center px-2 pt-1 pb-5 text-sm text-foreground'>
        {title}
        <Popover.Root bind:open>
            <Popover.Trigger class='grid grid-cols-[auto_auto] items-center gap-2 px-2 py-1 font-mono text-xs text-muted-foreground tabular-nums hover:bg-muted-foreground/10 hover:text-foreground data-[state=open]:bg-muted-foreground/10 data-[state=open]:text-foreground focus-visible:outline-2 focus-visible:outline-ring'>
                <Calendar class='size-[0.875rem]' aria-hidden='true' />
                {label}
            </Popover.Trigger>
            <Popover.Content align='end' class='grid w-auto gap-0 rounded-none border border-border p-0 shadow-txie-overlay ring-0'>
                <RangeCalendar bind:value={range} numberOfMonths={2} minValue={minDate} maxValue={end}
                    class='[--cell-radius:0] **:rounded-none'>
                    {#snippet day()}
                        <Day class='data-[range-start]:bg-brand-500 data-[range-start]:text-white data-[range-end]:bg-brand-500 data-[range-end]:text-white data-[range-middle]:text-brand-700 [&[data-today]:not([data-selected])]:bg-transparent [&[data-today]:not([data-selected])]:font-semibold [&[data-today]:not([data-selected])]:underline [&[data-today]:not([data-selected])]:decoration-brand-500 [&[data-today]:not([data-selected])]:underline-offset-4' />
                    {/snippet}
                </RangeCalendar>
                {@render Controls()}
            </Popover.Content>
        </Popover.Root>
    </figcaption>
    <Chart.Container {config} class='aspect-3/1 w-full py-2'>
        {#if data.length}
            <LineChart
                {data}
                {yDomain}
                x='date'
                axis
                padding={{ top: 10, right: 10, bottom: 30, left: 46 }}
                series={[
                    { key: 'upperSpec', label: config.upperSpec.label, color: config.upperSpec.color, ...dashed },
                    { key: 'value', label: config.value.label, color: config.value.color },
                    { key: 'lowerSpec', label: config.lowerSpec.label, color: config.lowerSpec.color, ...dashed },
                ]}
                props={{
                    spline: { curve: curveStepAfter },
                    xAxis: { format: (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), tickLabelProps: { dy: 20 } },
                    yAxis: { ticks: 5, class: 'tabular-nums', format: (n: number) => compact.format(n), tickLabelProps: { dx: -20 } },
                }}
            >
                {#snippet aboveMarks()}
                    <Points data={outOfSpec} x='date' y='value' r={3} class='fill-destructive stroke-none' />
                {/snippet}
                {#snippet tooltip()}
                    <Chart.Tooltip class='px-3.5 py-2.5 [&_[data-key=value]_span]:text-brand-500 [&_[data-key=value]_span:first-child]:text-brand-500/70' labelFormatter={(d) => stamp(new Date(d))} />
                {/snippet}
            </LineChart>
        {:else}
            <p class='grid h-full place-items-center text-sm text-muted-foreground'>No measurements in this range.</p>
        {/if}
    </Chart.Container>
</figure>
