<script lang="ts">
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		variant = "legend",
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLLegendElement>> & {
		variant?: "legend" | "label";
	} = $props();
</script>

<legend
	bind:this={ref}
	data-slot="field-legend"
	data-variant={variant}
	class={cn(
		"mb-2 max-w-full p-0 text-txie-ink leading-normal font-medium data-[variant=label]:text-sm data-[variant=legend]:text-lg",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</legend>
