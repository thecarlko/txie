<script lang="ts">
    import type { Snippet } from "svelte";
    import { Currency } from "$lib/components/currency";
    import * as Field from "$lib/components/field";
    import { Label } from "$lib/components/label";
    import * as ToggleGroup from "$lib/components/toggle-group";
    import type { CostCategory } from "$lib/models/procurement";
    import { activeCosts, chip, optionalCosts } from "./options";

    /** Cost lines in dollars: chips pick the optional categories, then each active line gets an amount. */
    let {
        amounts = $bindable(),
        categories = $bindable(),
        disabled = false,
        error = null,
        ontouch,
        toggles,
        children,
    }: {
        amounts: Partial<Record<CostCategory, number>>;
        categories: string[];
        disabled?: boolean;
        /** Shown under the purchase price */
        error?: string | null;
        ontouch?: () => void;
        /** Extra chips after the cost categories */
        toggles?: Snippet;
        /** Extra rows on the same icon / label / amount grid */
        children?: Snippet;
    } = $props();
</script>

<ToggleGroup.Root class='flex flex-wrap' type="multiple" {disabled} variant="outline" size="sm" spacing={2} bind:value={categories}>
    {#each optionalCosts as c (c.key)}
        <ToggleGroup.Item value={c.key} class={chip} {disabled}>{c.label}</ToggleGroup.Item>
    {/each}
    {@render toggles?.()}
</ToggleGroup.Root>

<div class='grid grid-cols-[auto_1fr_2fr] items-end gap-x-3 gap-y-2' onfocusout={ontouch}>
    {#each activeCosts(categories) as c (c.key)}
        <c.icon class='size-5 text-muted-foreground' />
        <Label class='pb-1'>{c.label}</Label>
        <Currency bind:value={amounts[c.key]} {disabled} placeholder={c.placeholder} variant='underline' />

        {#if c.key === "purchase" && error}
            <div class="col-span-3">
                <Field.Error>{error}</Field.Error>
            </div>
        {/if}
    {/each}
    {@render children?.()}
</div>
