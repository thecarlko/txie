<script lang="ts">
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLParagraphElement>> = $props();
</script>

<p
	bind:this={ref}
	data-slot="field-description"
	class={cn(
		"text-txie-secondary text-left text-sm leading-normal font-[400] break-words",
		"[&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-txie-ink",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</p>
