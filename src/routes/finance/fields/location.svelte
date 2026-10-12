<script lang="ts">
    import * as Field from "$lib/components/field";
    import * as RadioGroup from "$lib/components/radio-group";
    import { Label } from "$lib/components/label";
    import type { Location } from "$lib/models/procurement";
    import { locations } from "./options";

    let { value = $bindable(), disabled = false, error = null, ontouch }: {
        value: Location;
        disabled?: boolean;
        error?: string | null;
        ontouch?: () => void;
    } = $props();
</script>

<Field.Set>
    <Field.Legend class='font-medium text-lg mb-1'>Location</Field.Legend>
    <Field.Description>Where will this equipment be used?</Field.Description>

    <RadioGroup.Root bind:value {disabled} onfocusout={ontouch} class='grid grid-cols-2 gap-4 mt-4'>
        {#each locations as { value: option, label, icon: Icon } (option)}
            <Label
                for={`loc-${option}`}
                class={`flex flex-col gap-2 items-start border p-4 bg-accent opacity-50 font-medium transition-all
                data-[selected=true]:bg-white data-[selected=true]:shadow-md data-[selected=true]:text-slate-700 data-[selected=true]:opacity-100
                ${error ? 'border-destructive' : ''}
                ${disabled ? 'pointer-events-none' : 'cursor-pointer hover:opacity-100'}`}
                data-selected={option === value}>
                <RadioGroup.Item id={`loc-${option}`} class='sr-only' value={option} {disabled} />
                <Icon class='size-6 stroke-1' />
                <strong class='mt-2'>{label}</strong>
                <p class='font-normal uppercase'>{option}</p>
            </Label>
        {/each}
    </RadioGroup.Root>
    {#if error}
        <Field.Error>{error}</Field.Error>
    {/if}
</Field.Set>
