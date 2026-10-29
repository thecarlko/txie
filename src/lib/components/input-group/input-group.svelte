<script lang="ts">
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...props
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
	bind:this={ref}
	data-slot="input-group"
	role="group"
	class={cn(
		"group/input-group relative flex min-h-11 w-full min-w-0 items-center rounded-none border border-txie-control bg-txie-canvas text-txie-ink shadow-none outline-none transition-colors duration-150 motion-reduce:transition-none",
		"hover:border-txie-ink has-[[data-slot=input-group-control]:focus-visible]:outline-2 has-[[data-slot=input-group-control]:focus-visible]:outline-offset-2 has-[[data-slot=input-group-control]:focus-visible]:outline-txie-ink has-[[data-slot=input-group-control][aria-invalid=true]]:border-txie-error has-[[data-slot=input-group-control]:disabled]:bg-txie-header has-[[data-slot=input-group-control]:disabled]:hover:border-txie-control has-[[data-slot=input-group-control][readonly]]:bg-txie-header",
		"has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-start]]:flex-col has-[>[data-align=inline-end]]:[&>input]:pr-2 has-[>[data-align=inline-start]]:[&>input]:pl-2",
		className
	)}
	{...props}
>
	{@render children?.()}
</div>
