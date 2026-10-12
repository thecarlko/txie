<script lang="ts">
    import { untrack } from "svelte";
    import * as Field from "$lib/components/field";
    import * as ToggleGroup from "$lib/components/toggle-group";
    import { Input } from "$lib/components/input";
    import { Label } from "$lib/components/label";
    import { chip } from "./options";

    let { value = $bindable() as string[], disabled = false } = $props();

    const presets = [
        { label: "Process Module", items: ["PM6.2", "PM6.3", "PM6.4"] },
        { label: "Test Vehicle", items: ["TV1", "TV2", "TV3"] },
    ];
    const known = [...presets.flatMap((g) => g.items), "LAX"];

    // Programs saved on this snapshot that aren't in the lists above still need a chip
    let others = $state(["LAX", ...untrack(() => value.filter((p) => !known.includes(p)))]);
    const groups = $derived([...presets, { label: "Other", items: others }]);

    let custom = $state("");

    function addCustom(e: KeyboardEvent) {
        if (e.key !== "Enter" || custom.trim() === "") return;
        e.preventDefault();
        const program = custom.trim().toUpperCase();
        if (!known.includes(program) && !others.includes(program)) others.push(program);
        if (!value.includes(program)) value = [...value, program];
        custom = "";
    }
</script>

<Field.Set>
    <Field.Legend class='font-medium text-lg mb-1'>Programs it supports</Field.Legend>
    <Field.Description>Pick every program that will use it or manually type to add.</Field.Description>

    <ToggleGroup.Root type="multiple" {disabled} variant="outline" size="sm" spacing={2} bind:value class="w-full flex-col items-start gap-4 mt-4">
        {#each groups as group (group.label)}
            <div class="flex flex-wrap items-center gap-2">
                <span class="w-28 text-sm text-muted-foreground">{group.label}</span>
                {#each group.items as p (p)}
                    <ToggleGroup.Item value={p} class={chip} {disabled}>{p}</ToggleGroup.Item>
                {/each}
            </div>
        {/each}
    </ToggleGroup.Root>
    <div class="mt-4 w-full sm:w-1/2">
        <Label for="customProgram" class="sr-only">Add custom program</Label>
        <Input id="customProgram" bind:value={custom} {disabled} onkeydown={addCustom} placeholder="Type program and hit Enter to add" />
    </div>
</Field.Set>
