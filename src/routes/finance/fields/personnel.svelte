<script lang="ts" module>
    import { generateID } from "$lib/hooks/hash";
    import type { Personnel, PersonnelRole } from "$lib/models/procurement";

    /** `id` only keys the rows in the form; it isn't saved */
    export type Stakeholder = Personnel & { id: string };

    export const newPerson = (role: PersonnelRole = "operator"): Stakeholder => ({ id: generateID(), name: "", email: "", role });
</script>

<script lang="ts">
    import { slide } from "svelte/transition";
    import { Trash, UserRoundPlus } from "@lucide/svelte";
    import { Button } from "$lib/components/button";
    import * as Field from "$lib/components/field";
    import { Input } from "$lib/components/input";
    import * as Select from "$lib/components/select";
    import { roleLabel } from "$lib/data/labels";
    import { roles } from "./options";

    let { value = $bindable(), disabled = false, error = null, ontouch }: {
        value: Stakeholder[];
        disabled?: boolean;
        error?: string | null;
        ontouch?: () => void;
    } = $props();
</script>

<Field.Set class="@container/personnel">
    <Field.Legend>Personnel</Field.Legend>
    <Field.Description>Who will be responsible for operating and maintaining this equipment?</Field.Description>

    <div class="grid gap-3" onfocusout={ontouch}>
        {#each value as { id, role }, index (id)}
            <div class="grid grid-cols-1 items-center gap-2 @lg/personnel:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_11rem_auto]" transition:slide>
                <Input bind:value={value[index].name} {disabled} autocomplete="off" aria-label="Name" placeholder="Sugento Huandra" aria-invalid={!!error} aria-describedby={error ? 'personnel-error' : undefined} />
                <Input bind:value={value[index].email} {disabled} type="email" autocomplete="off" aria-label="Email" placeholder="sugento_huandra@txie.org" />
                <Select.Root type="single" bind:value={value[index].role} {disabled}>
                    <Select.Trigger class="w-full data-[size=default]:h-11 border-txie-control shadow-none" aria-label="Role">{roleLabel[role] ?? "Choose a role"}</Select.Trigger>
                    <Select.Content class='rounded-none'>
                        {#each roles as { value, label } (value)}<Select.Item {value} {label} />{/each}
                    </Select.Content>
                </Select.Root>
                <Button size="icon" variant="ghost" {disabled} aria-label="Remove person" onclick={() => (value = value.filter(({ id: personId }) => personId !== id))}>
                    <Trash class="size-4" />
                </Button>
            </div>
        {/each}
    </div>

    <Button size="sm" variant="outline" {disabled} class="w-max gap-2 shadow-none" onclick={() => (value = [...value, newPerson()])}><UserRoundPlus class="size-4" /> Add person</Button>
    {#if error}
        <Field.Error id="personnel-error">{error}</Field.Error>
    {/if}
</Field.Set>
