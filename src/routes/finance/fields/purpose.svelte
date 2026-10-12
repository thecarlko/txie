<script lang="ts">
    import type { Component } from "svelte";
    import * as Field from "$lib/components/field";
    import * as InputGroup from "$lib/components/input-group";
    import * as RadioGroup from "$lib/components/radio-group";
    import { Input } from "$lib/components/input";
    import { Label } from "$lib/components/label";
    import type { NeedType } from "$lib/models/procurement";
    import { needTypes } from "./options";

    let {
        purpose = $bindable(),
        needType = $bindable(),
        details = $bindable(),
        gap = $bindable(),
        disabled = false,
        errors = {},
        ontouch,
    }: {
        purpose: string;
        needType: NeedType;
        details: string;
        gap: string;
        disabled?: boolean;
        errors?: { purpose?: string | null; gap?: string | null };
        ontouch?: (field: "purpose" | "gap") => void;
    } = $props();
</script>

<Field.Field>
    <Field.Label for="purpose" class='font-medium text-lg'>Purpose</Field.Label>
    <Field.Description>What is this equipment for? Does it enable any new technology or process that isn't currently available?</Field.Description>

    <Input
        bind:value={purpose}
        id='purpose'
        type='text'
        {disabled}
        onblur={() => ontouch?.("purpose")}
        placeholder='Wafer Based Plasma Dicer'
        class={[errors.purpose && 'border-destructive']}
    />
    {#if errors.purpose}
        <Field.Error class="mb-4">{errors.purpose}</Field.Error>
    {/if}
</Field.Field>
<br>

<Field.Set>
    <Field.Legend variant="label">What kind of need is it?</Field.Legend>
    <RadioGroup.Root bind:value={needType} {disabled} class="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {#each needTypes as n (n.value)}
            {@render Choice(n.value, n.label, n.hint, n.icon)}
        {/each}
    </RadioGroup.Root>
</Field.Set>
<br>

<Field.Field>
    <Field.Label for="details">What will it do, and why do we need it?</Field.Label>
    <InputGroup.Root>
        <InputGroup.Textarea
            id="details"
            bind:value={details}
            {disabled}
            maxlength={300}
            class="min-h-20 resize-none"
            placeholder={"Supports C4 bumping when pitch is 200 µm or more.\nSeveral customers are asking for 4 to 16 mil spheres, SnPb and SnAg."} />
        {@render Count(details, 300)}
    </InputGroup.Root>
</Field.Field>
<br>

<Field.Field>
    <Field.Label for="gap">What can't you do today that this fixes?</Field.Label>
    <InputGroup.Root>
        <InputGroup.Textarea
            id="gap"
            bind:value={gap}
            {disabled}
            maxlength={200}
            onblur={() => ontouch?.("gap")}
            class={["min-h-20 resize-none", errors.gap && 'border-destructive']}
            placeholder="Bumping is manual, slow, and error-prone. This automates it and raises throughput." />
        {@render Count(gap, 200)}
    </InputGroup.Root>
    {#if errors.gap}
        <Field.Error class="mt-2">{errors.gap}</Field.Error>
    {/if}
</Field.Field>

{#snippet Choice(value: NeedType, label: string, hint: string, Icon: Component)}
    <Label for={`need-${value}`} data-selected={value === needType} class={
        `flex flex-col items-start gap-1.5 border px-4 py-4 bg-accent/60 opacity-60 transition-all
        has-focus-visible:ring-2 has-focus-visible:ring-ring
        data-[selected=true]:bg-background data-[selected=true]:shadow-md data-[selected=true]:opacity-100 data-[selected=true]:border-foreground/30
        ${disabled ? 'pointer-events-none' : 'cursor-pointer hover:opacity-100'}`
    }>
        <Icon class='size-5 row-span-2' />
        <strong class="mt-1 font-medium">{label}</strong>
        <p class="text-sm font-normal text-muted-foreground">{hint}</p>
        <RadioGroup.Item id={`need-${value}`} class="sr-only" {value} {disabled} />
    </Label>
{/snippet}

{#snippet Count(value: string, max: number)}
    <InputGroup.Addon align="block-end">
        <InputGroup.Text class="ms-auto text-xs tabular-nums">{max - value.length} left</InputGroup.Text>
    </InputGroup.Addon>
{/snippet}
