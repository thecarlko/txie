<script lang="ts" module>
    export type CustomSpec = { title: string; value: string; placeholder: string };
</script>

<script lang="ts">
    import { slide } from "svelte/transition";
    import { Plus, Trash } from "@lucide/svelte";
    import { Button } from "$lib/components/button";
    import * as Field from "$lib/components/field";
    import { Input } from "$lib/components/input";
    import * as ToggleGroup from "$lib/components/toggle-group";
    import { chip, defaultSpecs } from "./options";

    /** `active` holds the ids of the chosen default specs and `values` their targets, keyed by id */
    let {
        active = $bindable() as string[],
        values = $bindable() as Record<string, string>,
        custom = $bindable() as CustomSpec[],
        disabled = false as boolean,
    } = $props();

    let newTitle = $state("");
    let newValue = $state("");
    const canAdd = $derived(!!newTitle && !!newValue);

    function addSpec() {
        if (!canAdd) return;
        custom = [...custom, { title: newTitle, value: newValue, placeholder: newValue }];
        newTitle = "";
        newValue = "";
    }
</script>

<Field.Set>
    <Field.Legend class='font-medium text-lg mb-1'>Target Specifications & Capabilities</Field.Legend>
    <Field.Description>Select the specs required and outline the targets they must hit.</Field.Description>

    <ToggleGroup.Root class='flex flex-wrap' type="multiple" {disabled} variant="outline" size="sm" spacing={2} bind:value={active}>
        {#each defaultSpecs as spec (spec.id)}
            <ToggleGroup.Item value={spec.id} class={chip} {disabled}>{spec.label}</ToggleGroup.Item>
        {/each}
    </ToggleGroup.Root>

    <div class='grid grid-cols-[1fr_2fr_auto] items-center gap-x-8 gap-y-1 mt-4' transition:slide>
        {#each defaultSpecs.filter((s) => active.includes(s.id)) as spec (spec.id)}
            <strong class="text-sm">{spec.label}</strong>
            <Input variant='underline' bind:value={values[spec.id]} {disabled} placeholder={spec.placeholder} class='h-8' />
            <div class="size-8"></div>
        {/each}

        {#each custom as spec, i}
            <strong class="text-sm">{spec.title}</strong>
            <Input variant='underline' bind:value={custom[i].value} {disabled} placeholder={spec.placeholder} class='h-8' />
            <Button class='size-8' variant='ghost' {disabled} aria-label="Remove spec" onclick={() => (custom = custom.filter((_, idx) => idx !== i))}><Trash /></Button>
        {/each}

        <Input variant='underline' bind:value={newTitle} {disabled} class='px-0 shadow-transparent text-sm font-medium' placeholder='Add custom spec...' />
        <Input variant='underline' bind:value={newValue} {disabled} placeholder='Value or unit' />
        <Button class='size-8' variant={canAdd ? 'default' : 'ghost'} disabled={disabled || !canAdd} aria-label="Add spec" onclick={addSpec}><Plus /></Button>
    </div>
</Field.Set>
