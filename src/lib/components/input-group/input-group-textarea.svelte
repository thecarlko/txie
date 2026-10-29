<script lang="ts">
	import { Textarea } from "$lib/components/textarea/index.js";
	import { cn } from "$lib/utils.js";
	import type { ComponentProps } from "svelte";

	let {
		ref = $bindable(null),
		value = $bindable(),
		class: className,
		...props
	}: ComponentProps<typeof Textarea> = $props();
</script>

<Textarea
	bind:ref
	data-slot="input-group-control"
	class={cn("min-h-24 min-w-0 flex-1 resize-y rounded-none border-0 bg-transparent px-3 py-2 text-base leading-normal font-[400] text-txie-ink shadow-none ring-0 placeholder:text-txie-secondary focus:ring-0 focus-visible:outline-none focus-visible:ring-0 aria-invalid:ring-0 dark:bg-transparent disabled:opacity-100 motion-reduce:transition-none md:text-base", className)}
	bind:value
	{...props}
/>
