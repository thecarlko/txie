<script lang="ts">
	import { Separator } from "$lib/components/separator/index.js";
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		children?: Snippet;
	} = $props();
</script>

<div
	bind:this={ref}
	data-slot="field-separator"
	data-content={!!children}
	class={cn("grid min-h-5 items-center text-sm", className)}
	{...restProps}
>
	<Separator class="col-start-1 row-start-1 bg-txie-rule" />
	{#if children}
		<span
			class="col-start-1 row-start-1 justify-self-center bg-txie-canvas px-2 text-txie-secondary"
			data-slot="field-separator-content"
		>
			{@render children()}
		</span>
	{/if}
</div>
