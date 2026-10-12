<script lang='ts'>
    import { untrack } from "svelte";
    import { BadgePercent, Star, Trash, Wrench } from "@lucide/svelte";
    import { Button } from "$lib/components/button";
    import { Currency } from "$lib/components/currency";
    import * as Field from "$lib/components/field";
    import { Label } from "$lib/components/label";
    import { Toggle } from "$lib/components/toggle";
    import * as ToggleGroup from "$lib/components/toggle-group";
    import { formatCurrency } from "$lib/hooks/finance";
    import { generateID } from "$lib/hooks/hash";
    import { database } from "$lib/data/smartsheet.svelte";
    import {
        parseFootprint, parseList, parseSupportItems,
        serializeBudget, serializeFootprint, serializeList, serializeSupportItems
    } from "$lib/data/snapshot-fields";
    import type { Utility, Vendor, VendorFlag } from "$lib/models/procurement";
    import { activeCents, activeTotal, budgetDollars, chip, flags as flagOptions, savedCategories } from "../fields/options";
    import EquipmentField from "../fields/equipment.svelte";
    import CostsField from "../fields/costs.svelte";
    import SupportItemsField, { type ItemRow } from "../fields/support-items.svelte";
    import FacilityField from "../fields/facility.svelte";
    import FlagsField from "../fields/flags.svelte";

    /** `locked` once FAB Leadership has decided on the request's latest draft */
    let { vendor, locked, onremove }: { vendor: Vendor; locked: boolean; onremove: () => void } = $props();

    // The parent keys this component by vendor id, so the form reads the record once.
    const initial = untrack(() => $state.snapshot(vendor));
    const id = initial.id;


    // --- Equipment ---
    let manufacturer = $state(initial.manufacturer);
    let model = $state(initial.model);
    let configuration = $state(initial.configuration ?? "");
    let leadTime = $state(initial.lead_time_weeks);


    // --- Support equipment (itemized; its total is the `support_equipment` cost) ---
    let items: ItemRow[] = $state(parseSupportItems(initial.support_items).map((item) => ({
        key: generateID(),
        name: item.name,
        cost: item.cost / 100 || undefined,
        leadTime: item.lead_time_weeks,
        size: parseFootprint(item.size),
    })));
    const supportTotal = $derived(items.reduce((sum, item) => sum + (item.cost ?? 0), 0));


    // --- Cost (form works in dollars, the record stores cents). Same line items as the proposal budget ---
    const savedCosts = budgetDollars(initial.costs);
    let costs = $state(savedCosts);
    // The discount is kept apart from `costs` (which can't go negative) but toggles like any other line
    let discount = $state(initial.discount ? initial.discount / 100 : undefined);
    let categories: string[] = $state([...savedCategories(savedCosts), ...(initial.discount ? ["discount"] : [])]);

    const hasDiscount = $derived(categories.includes("discount"));
    const total = $derived(activeTotal(costs, categories) + supportTotal - (hasDiscount ? (discount ?? 0) : 0));


    // --- Facility ---
    let footprint = $state(parseFootprint(initial.footprint));
    let utilities: string[] = $state(parseList<Utility>(initial.utilities));
    let utilityNote = $state(initial.utility_notes ?? "");
    let facilityAnalysis = $state(initial.facility_analysis);


    // --- Flags ---
    const savedFlags = parseList<VendorFlag>(initial.flags);
    let flags = $state(Object.fromEntries(flagOptions.map((f) => [f.key, savedFlags.includes(f.key)])) as Record<VendorFlag, boolean>);

    // Facility work is only saved while "Needs facility modifications" is on
    let facilityWork = $state(initial.facility_work ?? "");
    let facilityLeadTime = $state(initial.facility_lead_time_weeks);
    let facilityApproved = $state(initial.facility_approved);

    /** Everything has to arrive before the tool can run, so the longest lead time wins */
    const longestLeadTime = $derived(Math.max(
        leadTime ?? 0,
        ...items.map((item) => item.leadTime ?? 0),
        flags.facility_modification ? (facilityLeadTime ?? 0) : 0,
    ));


    // --- Saving ---
    /** The form, in the record's field formats. */
    function fields() {
        return {
            manufacturer: manufacturer.trim(),
            model: model.trim(),
            configuration: configuration.trim() || null,
            lead_time_weeks: leadTime || null,
            costs: serializeBudget({ ...activeCents(costs, categories), support_equipment: supportTotal * 100 }),
            discount: hasDiscount && discount ? Math.round(discount * 100) : null,
            support_items: serializeSupportItems(items.map((item) => ({
                name: item.name,
                cost: (item.cost ?? 0) * 100,
                lead_time_weeks: item.leadTime || null,
                size: serializeFootprint(item.size),
            }))),
            footprint: serializeFootprint(footprint),
            utilities: serializeList(utilities),
            utility_notes: utilityNote.trim() || null,
            facility_analysis: facilityAnalysis,
            facility_work: flags.facility_modification ? facilityWork.trim() || null : null,
            facility_lead_time_weeks: flags.facility_modification ? facilityLeadTime || null : null,
            facility_approved: flags.facility_modification && facilityApproved,
            flags: serializeList(flagOptions.filter((f) => flags[f.key]).map((f) => f.key)),
        };
    }

    // Auto-save. Starts from the loaded form so opening a vendor doesn't touch it.
    let lastSaved = JSON.stringify(fields());

    function save() {
        const patch = fields();
        const json = JSON.stringify(patch);
        if (json === lastSaved || locked) return;
        lastSaved = json;
        database.vendors.update(id, patch);
    }

    $effect(() => {
        fields();           // track every form field
        untrack(save);
    });
</script>

<!-- A disabled fieldset disables every control inside it once the request has a decision -->
<fieldset disabled={locked} class='grid gap-10 min-w-0'>
    <EquipmentField {id} bind:manufacturer bind:model bind:configuration bind:leadTime />

    <hr class='border-dashed'>

    <Field.Set>
        <Field.Legend variant='label'>Cost</Field.Legend>
        <Field.Description>How much is the estimated cost for this tool? Select any additional costs that apply, such as support equipment that needs to be purchased or rented.</Field.Description>

        <CostsField bind:amounts={costs} bind:categories>
            {#snippet toggles()}
                <ToggleGroup.Item value='discount' class={chip}>Discount</ToggleGroup.Item>
            {/snippet}

            {#if items.length}
                <Wrench class='size-5 text-muted-foreground' />
                <Label class='pb-1'>Support Equipment</Label>
                <span class='pb-1 px-3 tabular-nums'>{formatCurrency(supportTotal)} <span class='text-muted-foreground'>· itemized below</span></span>
            {/if}
            {#if hasDiscount}
                <BadgePercent class='size-5 text-green-600' />
                <Label class='pb-1'>Discount <span class='font-normal text-muted-foreground'>(subtracted)</span></Label>
                <Currency bind:value={discount} placeholder='0' variant='underline' />
            {/if}

            <p class='col-span-2 pt-4 text-sm text-muted-foreground'>{longestLeadTime ? `Longest lead time: ${longestLeadTime} weeks` : ''}</p>
            <strong class='text-xl font-medium tabular-nums text-end'>{formatCurrency(total)}</strong>
        </CostsField>
    </Field.Set>

    <SupportItemsField bind:items />

    <hr class='border-dashed'>

    <FacilityField {id} bind:footprint bind:utilities bind:note={utilityNote} bind:analysis={facilityAnalysis} />

    <FlagsField {id} bind:flags bind:work={facilityWork} bind:workLeadTime={facilityLeadTime} bind:workApproved={facilityApproved} />

    <!-- Actions -->
    <div class='flex gap-2 border-t border-dashed pt-10'>
        <Toggle pressed={vendor.recommended} onPressedChange={(pressed) => database.vendors.recommend(id, pressed)} size='sm' variant='outline' class='gap-2 pr-4 aria-pressed:bg-transparent aria-pressed:border-orange-400'>
            <Star class='group-aria-pressed/toggle:stroke-0 group-aria-pressed/toggle:fill-orange-400' /> Recommend
        </Toggle>
        <Button variant='ghost' size='sm' class='px-3 hover:text-red-500' onclick={onremove}>
            <Trash class='size-4' /> Delete
        </Button>
    </div>
</fieldset>
