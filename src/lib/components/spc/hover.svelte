<script lang='ts' generics='T'>
    import { getChartContext } from 'layerchart';

    // Mirrors the chart's hovered datum out to the parent; renders nothing.
    let { point = $bindable() }: { point: T | null } = $props();
    const { tooltip } = getChartContext();
    $effect(() => { point = (tooltip.data as T) ?? null; });
</script>
