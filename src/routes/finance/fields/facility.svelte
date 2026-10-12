<script lang="ts">
    import { slide } from "svelte/transition";
    import * as Field from "$lib/components/field";
    import { Input } from "$lib/components/input";
    import { Label } from "$lib/components/label";
    import { Switch } from "$lib/components/switch";
    import * as ToggleGroup from "$lib/components/toggle-group";
    import type { Footprint } from "$lib/models/procurement";
    import { chip, dimensions, utilities as utilityOptions } from "./options";

    /** `id` prefixes the element ids so several vendor forms can share a page */
    let {
        id,
        footprint = $bindable(),
        utilities = $bindable(),
        note = $bindable(),
        analysis = $bindable(),
    }: {
        id: string;
        footprint: Footprint;
        utilities: string[];
        note: string;
        analysis: boolean;
    } = $props();
</script>

<Field.Set>
    <Field.Legend>Facility</Field.Legend>
    <Field.Description>What facility requirements will this equipment need? (e.g. footprint, power, water, gas, vacuum, etc.)</Field.Description>

    <div class='grid grid-cols-3 gap-x-4 gap-y-2'>
        {#each dimensions as d (d.key)}
            <Label for='{id}-{d.key}'>{d.label}</Label>
        {/each}
        {#each dimensions as d (d.key)}
            <Input bind:value={footprint[d.key]} id='{id}-{d.key}' type='number' min='0' placeholder='0' />
        {/each}
    </div>

    <div>
        <Field.Legend variant='label'>Utilities</Field.Legend>
        <ToggleGroup.Root type='multiple' variant='outline' size='sm' spacing={2} bind:value={utilities} class='flex-wrap'>
            {#each utilityOptions as u (u.value)}
                <ToggleGroup.Item value={u.value} class={chip}><u.icon class='size-4' /> {u.label}</ToggleGroup.Item>
            {/each}
        </ToggleGroup.Root>
        {#if utilities.length}
            <div class='pt-4' transition:slide>
                <Input bind:value={note} maxlength={140} aria-label='Utility details' placeholder='Specifics, e.g. 208 V 3-phase, 40 A, N2 and CDA' />
            </div>
        {/if}
    </div>

    <div class='grid grid-cols-[1fr_auto] items-center gap-3'>
        <Label for='{id}-analysis' class='grid gap-1'>
            Facilities capacity analysis completed
            <span class='text-sm font-normal text-muted-foreground'>Confirms the tool stays within fab spec for UPW, chemicals, power, etc.</span>
        </Label>
        <Switch id='{id}-analysis' bind:checked={analysis} />
    </div>
</Field.Set>
