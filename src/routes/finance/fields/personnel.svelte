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

<Field.Set>
    <Field.Legend class='font-medium text-lg mb-1'>Personnel</Field.Legend>
    <Field.Description>Who will be responsible for operating and maintaining this equipment?</Field.Description>

    <div class="space-y-2 mt-4" onfocusout={ontouch}>
        <Field.Legend variant="label">Who will own, run, and maintain it?</Field.Legend>
        {#each value as s (s.id)}
            <div class="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[1fr_1fr_11rem_auto]" transition:slide>
                <Input bind:value={s.name} {disabled} autocomplete="off" aria-label="Name" placeholder="Sugento Huandra" class={error ? 'border-destructive' : ''} />
                <Input bind:value={s.email} {disabled} type="email" autocomplete="off" aria-label="Email" placeholder="sugento_huandra@txie.org" />
                <Select.Root type="single" bind:value={s.role} {disabled}>
                    <Select.Trigger class="w-full" aria-label="Role">{roleLabel[s.role] ?? "Choose a role"}</Select.Trigger>
                    <Select.Content class='rounded-none'>
                        {#each roles as r (r.value)}<Select.Item value={r.value} label={r.label} />{/each}
                    </Select.Content>
                </Select.Root>
                <Button size="icon" variant="ghost" {disabled} aria-label="Remove person" onclick={() => (value = value.filter((x) => x.id !== s.id))}>
                    <Trash class="size-4" />
                </Button>
            </div>
        {/each}
    </div>

    <Button size="sm" variant="outline" {disabled} class="w-max gap-2 mt-2 mb-2" onclick={() => (value = [...value, newPerson()])}><UserRoundPlus class="size-4" /> Add person</Button>
    {#if error}
        <Field.Error>{error}</Field.Error>
    {/if}
</Field.Set>
