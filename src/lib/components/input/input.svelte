<script lang="ts">
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLInputAttributes, HTMLInputTypeAttribute } from "svelte/elements";

	type InputType = Exclude<HTMLInputTypeAttribute, "file">;

	type Props = WithElementRef<
		Omit<HTMLInputAttributes, "type"> &
			({ type: "file"; files?: FileList } | { type?: InputType; files?: undefined }) & {
				variant?: "default" | "underline";
			}
	>;

	let {
		ref = $bindable(null),
		value = $bindable(),
		type,
		variant = "default",
		files = $bindable(),
		class: className,
		"data-slot": dataSlot = "input",
		...restProps
	}: Props = $props();

	const inputClass = $derived(cn(
		"h-11 w-full min-w-0 rounded-none border border-txie-control bg-txie-canvas px-3 py-2 text-base leading-normal font-[400] text-txie-ink shadow-none outline-none placeholder:text-txie-secondary file:mr-3 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-txie-ink",
		"transition-colors duration-150 motion-reduce:transition-none enabled:hover:border-txie-ink focus:ring-0 focus:border-txie-control focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-txie-ink aria-invalid:border-txie-error aria-invalid:hover:border-txie-error aria-invalid:focus:border-txie-error disabled:cursor-not-allowed disabled:bg-txie-header disabled:opacity-100 [&[readonly]]:bg-txie-header",
		variant === "underline" && "border-0 border-b bg-transparent",
		className
	));
</script>

{#if type === "file"}
	<input
		bind:this={ref}
		data-slot={dataSlot}
		data-variant={variant}
		class={inputClass}
		type="file"
		bind:files
		bind:value
		{...restProps}
	/>
{:else}
	<input
		bind:this={ref}
		data-slot={dataSlot}
		data-variant={variant}
		class={inputClass}
		{type}
		bind:value
		{...restProps}
	/>
{/if}
