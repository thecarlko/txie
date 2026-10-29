<script lang="ts" module>
	import { tv, type VariantProps } from "tailwind-variants";

	const inputGroupButtonVariants = tv({
		base: "flex items-center gap-2 rounded-none text-sm font-medium shadow-none focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-txie-ink disabled:opacity-100 motion-reduce:transition-none",
		variants: {
			size: {
				xs: "h-8 gap-1 px-2 [&>svg:not([class*='size-'])]:size-4",
				sm: "h-9 px-3",
				"icon-xs": "size-8 p-0 has-[>svg]:p-0",
				"icon-sm": "size-9 p-0 has-[>svg]:p-0",
			},
		},
		defaultVariants: {
			size: "xs",
		},
	});

	export type InputGroupButtonSize = VariantProps<typeof inputGroupButtonVariants>["size"];
</script>

<script lang="ts">
	import { Button } from "$lib/components/button/index.js";
	import { cn } from "$lib/utils.js";
	import type { ComponentProps } from "svelte";

	let {
		ref = $bindable(null),
		class: className,
		children,
		type = "button",
		variant = "ghost",
		size = "xs",
		...restProps
	}: Omit<ComponentProps<typeof Button>, "href" | "size"> & {
		size?: InputGroupButtonSize;
	} = $props();
</script>

<Button
	bind:ref
	{type}
	data-size={size}
	{variant}
	class={cn(
		inputGroupButtonVariants({ size }),
		variant === "default" && "bg-txie-ink text-txie-canvas hover:bg-txie-ink/90",
		variant === "outline" && "border-txie-control bg-txie-canvas text-txie-ink hover:bg-txie-header dark:border-txie-control dark:bg-txie-canvas dark:hover:bg-txie-header",
		variant === "secondary" && "bg-txie-header text-txie-ink hover:bg-txie-selected",
		variant === "ghost" && "text-txie-ink hover:bg-txie-header hover:text-txie-ink dark:hover:bg-txie-header",
		variant === "link" && "text-txie-ink",
		variant === "destructive" && "bg-txie-error/10 text-txie-error hover:bg-txie-error/20 dark:bg-txie-error/10 dark:hover:bg-txie-error/20",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</Button>
