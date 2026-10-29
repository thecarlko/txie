<script lang="ts">
	import { Label } from "$lib/components/label/index.js";
	import { cn } from "$lib/utils.js";
	import type { ComponentProps } from "svelte";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: ComponentProps<typeof Label> = $props();
</script>

<Label
	bind:ref
	data-slot="field-label"
	class={cn(
		"group/field-label peer/field-label flex w-fit gap-2 text-sm leading-normal font-medium text-txie-ink group-data-[disabled=true]:opacity-100 peer-disabled:opacity-100",
		"has-[>[data-slot=field]]:grid has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:rounded-none has-[>[data-slot=field]]:border has-[>[data-slot=field]]:border-txie-control has-[>[data-slot=field]]:bg-txie-canvas *:data-[slot=field]:p-3",
		"has-[>[data-slot=field]]:not-has-[:disabled,[data-disabled]]:hover:border-txie-ink has-data-checked:bg-txie-selected has-data-checked:border-txie-accent has-[>[data-slot=field]]:has-[:focus-visible]:outline-2 has-[>[data-slot=field]]:has-[:focus-visible]:outline-offset-2 has-[>[data-slot=field]]:has-[:focus-visible]:outline-txie-ink",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</Label>
