<script lang="ts" module>
	import { tv, type VariantProps } from "tailwind-variants";
	export const inputGroupAddonVariants = tv({
		base: "flex h-auto shrink-0 cursor-text items-center justify-center gap-2 py-1 text-sm leading-normal font-[400] text-txie-secondary [&>kbd]:rounded-none [&>svg:not([class*='size-'])]:size-4",
		variants: {
			align: {
				"inline-start": "order-first pl-3",
				"inline-end": "order-last pr-3",
				"block-start": "order-first w-full flex-wrap justify-start px-3 pt-2 [.border-b]:pb-2",
				"block-end": "order-last w-full flex-wrap justify-start px-3 pb-2 [.border-t]:pt-2",
			},
		},
		defaultVariants: {
			align: "inline-start",
		},
	});

	export type InputGroupAddonAlign = VariantProps<typeof inputGroupAddonVariants>["align"];
</script>

<script lang="ts">
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		children,
		align = "inline-start",
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		align?: InputGroupAddonAlign;
	} = $props();
</script>

<div
	bind:this={ref}
	role="group"
	data-slot="input-group-addon"
	data-align={align}
	class={cn(inputGroupAddonVariants({ align }), className)}
	onclick={({ target, currentTarget }) => {
		if ((target as Element).closest("button, a, input, textarea, select, [role=button]")) {
			return;
		}
		currentTarget.parentElement?.querySelector<HTMLInputElement | HTMLTextAreaElement>("input, textarea")?.focus();
	}}
	{...restProps}
>
	{@render children?.()}
</div>
