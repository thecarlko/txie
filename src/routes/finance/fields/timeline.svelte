<script lang="ts">
    import type { DateValue } from "@internationalized/date";
    import { DatePicker } from "$lib/components/date-picker";
    import * as Field from "$lib/components/field";
    import { Input } from "$lib/components/input";
    import { Label } from "$lib/components/label";
    import * as ToggleGroup from "$lib/components/toggle-group";
    import { firmnessLabel, forceLabel } from "$lib/data/labels";
    import type { Firmness, Force } from "$lib/models/procurement";
    import { chip } from "./options";

    let {
        due = $bindable(),
        consequence = $bindable(),
        firmness = $bindable(),
        force = $bindable(),
        disabled = false,
    }: {
        due: DateValue | undefined;
        consequence: string;
        firmness: Firmness;
        force: Force;
        disabled?: boolean;
    } = $props();

    const firmnesses: Firmness[] = ["hard", "target", "flexible"];
    // The chips ask "Is something forcing the timeline?", so "none" reads as a plain "No"
    const forces: { value: Force; label: string }[] = [
        { value: "none", label: "No" },
        { value: "expedited", label: forceLabel.expedited },
        { value: "emergency", label: forceLabel.emergency },
    ];
</script>

<Field.Set>
    <Field.Legend class='font-medium text-lg mb-1'>Target Operational Date</Field.Legend>
    <Field.Description>When do you need this tool installed & operational by? Approximate date is fine.</Field.Description>

    <Field.Field orientation='horizontal'>
        <Field.Label for='due'>Installed & operational by</Field.Label>
        <DatePicker bind:value={due} {disabled} placeholder="Select a date" />
    </Field.Field>

    <Field.Field>
        <Field.Label for="consequence">What happens if it's late?</Field.Label>
        <Input id="consequence" bind:value={consequence} {disabled} maxlength={140} placeholder="We miss the July milestones for the new product line." />
    </Field.Field>

    <div class='grid grid-cols-1 lg:grid-cols-2 gap-x-2 gap-y-2'>
        <Label>How firm is that date?</Label>
        <ToggleGroup.Root type="single" {disabled} variant="outline" size="sm" spacing={2} bind:value={firmness} class="justify-start">
            {#each firmnesses as f (f)}
                <ToggleGroup.Item value={f} class={chip} {disabled}>{firmnessLabel[f]}</ToggleGroup.Item>
            {/each}
        </ToggleGroup.Root>

        <Label>Is something forcing the timeline?</Label>
        <ToggleGroup.Root type="single" {disabled} variant="outline" size="sm" spacing={2} bind:value={force} class="justify-start">
            {#each forces as f (f.value)}
                <ToggleGroup.Item value={f.value} class={chip} {disabled}>{f.label}</ToggleGroup.Item>
            {/each}
        </ToggleGroup.Root>
    </div>
</Field.Set>
