<script lang="ts">
    import type { Component } from "svelte";
    import { slide } from "svelte/transition";
    import { BadgeCheck, CircleX, Undo2 } from "@lucide/svelte";
    import { Currency } from "$lib/components/currency";
    import * as Field from "$lib/components/field";
    import * as InputGroup from "$lib/components/input-group";
    import { Label } from "$lib/components/label";
    import * as RadioGroup from "$lib/components/radio-group";
    import type { Decision } from "$lib/models/procurement";

    /** FAB Leadership's gate decision. `budget` is in dollars and only asked for on approval. */
    let {
        decision = $bindable(),
        budget = $bindable(),
        comments = $bindable(),
        budgetPlaceholder,
        errors = {},
        ontouch,
    }: {
        decision: Decision | "";
        budget: number;
        comments: string;
        budgetPlaceholder: number;
        errors?: { decision?: string | null; comments?: string | null };
        ontouch?: (field: "decision" | "comments") => void;
    } = $props();

    const { decision: decisionError, comments: commentsError } = $derived(errors);

    const options: { value: Decision; label: string; icon: Component; color: string }[] = [
        { value: "approved", label: "Approve Envelope", icon: BadgeCheck, color: "text-green-600" },
        { value: "changes_requested", label: "Request Changes", icon: Undo2, color: "text-orange-500" },
        { value: "rejected", label: "Reject", icon: CircleX, color: "text-red-500" },
    ];
</script>

<Field.Set>
    <Field.Legend>Decision</Field.Legend>
    <Field.Description>Is this problem worth solving with the recommended equipment, at this cost?</Field.Description>

    <RadioGroup.Root bind:value={decision} onfocusout={() => ontouch?.("decision")} class='grid grid-cols-3 gap-3'>
        {#each options as { value, label, icon: Icon, color } (value)}
            <Label data-selected={value === decision} class='cursor-pointer border flex flex-col items-center justify-center gap-2 px-2 py-4 transition-all opacity-70 hover:opacity-100 data-[selected=true]:bg-background data-[selected=true]:shadow-sm data-[selected=true]:opacity-100 data-[selected=true]:border-foreground/40'>
                <RadioGroup.Item {value} class='hidden' />
                <Icon class='size-6 stroke-[1.5] {color}' />
                <span class="text-sm font-medium text-center">{label}</span>
            </Label>
        {/each}
    </RadioGroup.Root>
    {#if decisionError}
        <Field.Error>{decisionError}</Field.Error>
    {/if}
</Field.Set>

{#if decision === "approved"}
    <div transition:slide>
        <Field.Set>
            <Field.Legend>Authorized Budget Envelope</Field.Legend>
            <Field.Description>Set the budget authorized for this purchase. By default, this is the recommended vendor's quote.</Field.Description>

            <Currency bind:value={budget} placeholder={budgetPlaceholder.toString()} class="text-xl" />
        </Field.Set>
    </div>
{/if}

<Field.Field>
    <Field.Label for="comments" class='font-medium'>Comments & Conditions</Field.Label>
    <InputGroup.Root>
        <InputGroup.Textarea
            id="comments"
            bind:value={comments}
            onblur={() => ontouch?.("comments")}
            class="min-h-32 resize-none"
            aria-invalid={!!commentsError}
            aria-describedby={commentsError ? 'comments-error' : undefined}
            placeholder="Provide feedback, conditions of approval, or reasons for rejection..." />
    </InputGroup.Root>
    {#if commentsError}
        <Field.Error id="comments-error">{commentsError}</Field.Error>
    {/if}
</Field.Field>
