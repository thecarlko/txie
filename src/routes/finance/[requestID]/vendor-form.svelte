<script lang='ts'>
    import { untrack, type Component } from "svelte";
    import { slide } from "svelte/transition";
    import {
        Activity, BadgePercent, Biohazard, Building, Cylinder, DollarSign, Droplets, Ellipsis, Fan, FlaskConical,
        Globe, GraduationCap, Handshake, HardHat, Network, Package, Plus, Recycle, Replace, Star, Trash, Truck, Wind, Wrench, X, Zap
    } from "@lucide/svelte";
    import { Button } from "$lib/components/button";
    import Currency from '$lib/components/currency/currency.svelte';
    import * as Field from "$lib/components/field";
    import { Input } from "$lib/components/input";
    import { Label } from "$lib/components/label";
    import { Switch } from "$lib/components/switch";
    import { Textarea } from "$lib/components/textarea";
    import { Toggle } from "$lib/components/toggle";
    import * as ToggleGroup from "$lib/components/toggle-group";
    import { formatCurrency } from "$lib/hooks/finance";
    import { database } from "$lib/data/smartsheet.svelte";
    import { generateID } from "$lib/hooks/hash";
    import {
        parseBudget, parseFootprint, parseList, parseSupportItems,
        serializeBudget, serializeFootprint, serializeList, serializeSupportItems
    } from "$lib/data/snapshot-fields";
    import type { CostCategory, Footprint, Utility, Vendor, VendorFlag } from "$lib/models/procurement";

    let { vendor, onremove }: { vendor: Vendor; onremove: () => void } = $props();

    // The parent keys this component by vendor id, so the form reads the record once.
    const initial = untrack(() => $state.snapshot(vendor));
    const id = initial.id;

    // Submitted vendors are read-only
    const locked = $derived(vendor.submitted_at !== null);


    // --- Equipment ---
    let manufacturer = $state(initial.manufacturer);
    let model = $state(initial.model);
    let configuration = $state(initial.configuration ?? "");
    let leadTime = $state(initial.lead_time_weeks);


    // --- Support equipment (itemized; its total is the `support_equipment` cost) ---
    type ItemRow = { key: string; name: string; cost?: number; leadTime: number | null; size: Footprint };

    let items: ItemRow[] = $state(parseSupportItems(initial.support_items).map((item) => ({
        key: generateID(),
        name: item.name,
        cost: item.cost / 100 || undefined,
        leadTime: item.lead_time_weeks,
        size: parseFootprint(item.size),
    })));
    const supportTotal = $derived(items.reduce((sum, item) => sum + (item.cost ?? 0), 0));

    function addItem() {
        items.push({ key: generateID(), name: "", leadTime: null, size: {} });
    }

    function removeItem(key: string) {
        items = items.filter((item) => item.key !== key);
    }


    // --- Cost (form works in dollars, the record stores cents). Same line items as the proposal budget ---
    const costItems: { key: CostCategory; label: string; icon: Component; placeholder: string }[] = [
        { key: "purchase", label: "Purchase Price", icon: DollarSign, placeholder: "280,000" },
        { key: "shipping", label: "Shipping & Freight", icon: Truck, placeholder: "10,000" },
        { key: "install_services", label: "Vendor Installation", icon: Replace, placeholder: "5,000" },
        { key: "fit_up", label: "Facility Fit-Up", icon: HardHat, placeholder: "15,000" },
        { key: "training", label: "Training", icon: GraduationCap, placeholder: "2,500" },
        { key: "spares", label: "Spare Parts", icon: Package, placeholder: "3,000" },
        { key: "service_contract", label: "Service Contract", icon: Handshake, placeholder: "7,500" },
        { key: "additional", label: "Miscellaneous & Fees", icon: Ellipsis, placeholder: "0" },
    ];
    const optionalCosts = costItems.filter((c) => c.key !== "purchase");

    let costs: Partial<Record<CostCategory, number>> = $state(
        Object.fromEntries(Object.entries(parseBudget(initial.costs)).map(([key, cents]) => [key, (cents ?? 0) / 100]))
    );
    // The discount is kept apart from `costs` (which can't go negative) but toggles like any other line
    let discount = $state(initial.discount ? initial.discount / 100 : undefined);
    let categories: string[] = $state([
        ...Object.keys(costs).filter((k) => costItems.some((c) => c.key === k && k !== "purchase")),
        ...(initial.discount ? ["discount"] : []),
    ]);

    // Deselected categories keep their value but are left out of the total and the save
    const activeCosts = $derived(costItems.filter((c) => c.key === "purchase" || categories.includes(c.key)));
    const hasDiscount = $derived(categories.includes("discount"));
    const total = $derived(activeCosts.reduce((sum, c) => sum + (costs[c.key] ?? 0), supportTotal) - (hasDiscount ? (discount ?? 0) : 0));


    // --- Facility ---
    const dimensions = [
        { key: "length", label: "Length (mm)" },
        { key: "width", label: "Width (mm)" },
        { key: "height", label: "Height (mm)" },
    ] as const;

    const utilityOptions: { value: Utility; label: string; icon: Component }[] = [
        { value: "power", label: "High power", icon: Zap },
        { value: "process_gases", label: "Process gases", icon: Cylinder },
        { value: "chemicals", label: "Chemicals", icon: FlaskConical },
        { value: "exhaust", label: "Exhaust", icon: Wind },
        { value: "di_water", label: "DI water", icon: Droplets },
        { value: "compressed_air", label: "Compressed air", icon: Fan },
        { value: "network", label: "Network", icon: Network },
        { value: "low_vibration", label: "Low vibration", icon: Activity },
    ];

    let footprint = $state(parseFootprint(initial.footprint));
    let utilities: string[] = $state(parseList<Utility>(initial.utilities));
    let utilityNote = $state(initial.utility_notes ?? "");
    let facilityAnalysis = $state(initial.facility_analysis);


    // --- Flags ---
    const flagDefs: { key: VendorFlag; label: string; hint: string; icon: Component }[] = [
        { key: "hazardous_materials", label: "Uses hazardous gases or chemicals", hint: "EHS will review before it's powered up.", icon: Biohazard },
        { key: "facility_modification", label: "Needs facility modifications", hint: "New utilities, structural work, or a pedestal.", icon: HardHat },
        { key: "export_controlled", label: "Export-controlled", hint: "May need a license or extra paperwork.", icon: Globe },
        { key: "new_vendor", label: "Vendor is new to TxIE", hint: "Not on our current vendor list.", icon: Building },
        { key: "refurbished", label: "Used or refurbished", hint: "Adds inspection and decontamination steps.", icon: Recycle },
    ];

    const savedFlags = parseList<VendorFlag>(initial.flags);
    let flags = $state(Object.fromEntries(flagDefs.map((f) => [f.key, savedFlags.includes(f.key)])) as Record<VendorFlag, boolean>);

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
            costs: serializeBudget({
                ...Object.fromEntries(activeCosts.map((c) => [c.key, (costs[c.key] ?? 0) * 100])),
                support_equipment: supportTotal * 100,
            }),
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
            flags: serializeList(flagDefs.filter((f) => flags[f.key]).map((f) => f.key)),
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

    const itemColumns = "grid grid-cols-[1fr_9rem_6rem_auto] gap-x-3";
    const chip = "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary";
</script>

<!-- A disabled fieldset disables every control inside it once the vendors are submitted -->
<fieldset disabled={locked} class='grid gap-10 min-w-0'>
<!-- Equipment -->
<div class='grid grid-cols-2 gap-y-3 gap-x-4'>
    <Label for='{id}-manufacturer'>Manufacturer</Label>
    <Label for='{id}-model'>Model</Label>
    <Input bind:value={manufacturer} id='{id}-manufacturer' type='text' placeholder='Applied Materials, LAM, Camtek ...' />
    <Input bind:value={model} id='{id}-model' type='text' placeholder='PJ9000' />

    <Label for='{id}-configuration' class='col-span-full pt-3'>Configuration</Label>
    <Textarea bind:value={configuration} id='{id}-configuration' maxlength={300} class='col-span-full min-h-20 resize-none' placeholder="200mm/300mm capability with 4 baths spec'd for Cu RDL, Bump Cu, Bump Ni, Bump SnAg" />

    <Label for='{id}-lead-time' class='col-span-full pt-3'>Lead time (weeks)</Label>
    <Input bind:value={leadTime} id='{id}-lead-time' type='number' min='0' placeholder='26' />
</div>

<hr class='border-dashed'>

<!-- Cost -->
<Field.Set>
    <Field.Legend variant='label'>Cost</Field.Legend>
    <Field.Description>How much is the estimated cost for this tool? Select any additional costs that apply, such as support equipment that needs to be purchased or rented.</Field.Description>

    <ToggleGroup.Root type='multiple' variant='outline' size='sm' spacing={2} bind:value={categories} class='flex-wrap'>
        {#each optionalCosts as c (c.key)}
            <ToggleGroup.Item value={c.key} class={chip}>{c.label}</ToggleGroup.Item>
        {/each}
        <ToggleGroup.Item value='discount' class={chip}>Discount</ToggleGroup.Item>
    </ToggleGroup.Root>

    <div class='grid grid-cols-[auto_1fr_2fr] items-end gap-x-3 gap-y-2'>
        {#each activeCosts as c (c.key)}
            <c.icon class='size-5 text-muted-foreground' />
            <Label class='pb-1'>{c.label}</Label>
            <Currency bind:value={costs[c.key]} placeholder={c.placeholder} variant='underline' />
        {/each}
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
    </div>
</Field.Set>

<hr class='border-dashed'>


<!-- Facility -->
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
                <Input bind:value={utilityNote} maxlength={140} aria-label='Utility details' placeholder='Specifics, e.g. 208 V 3-phase, 40 A, N2 and CDA' />
            </div>
        {/if}
    </div>

    <div class='grid grid-cols-[1fr_auto] items-center gap-3'>
        <Label for='{id}-analysis' class='grid gap-1'>
            Facilities capacity analysis completed
            <span class='text-sm font-normal text-muted-foreground'>Confirms the tool stays within fab spec for UPW, chemicals, power, etc.</span>
        </Label>
        <Switch id='{id}-analysis' bind:checked={facilityAnalysis} />
    </div>
</Field.Set>

<!-- Flags -->
<Field.Set>
    <Field.Legend variant='label'>Do any of these apply for the equipment?</Field.Legend>
    <Field.Group class='grid items-center grid-cols-[auto_1fr_auto] gap-3'>
        {#each flagDefs as flag (flag.key)}
            <flag.icon class='size-5 stroke-[1.2]' />
            <Label for='{id}-flag-{flag.key}' class='font-[350]'>{flag.label}</Label>
            <Switch id='{id}-flag-{flag.key}' bind:checked={flags[flag.key]} />
            {#if flag.key === 'facility_modification' && flags.facility_modification}
                <div class='col-start-2 col-span-2 grid grid-cols-[1fr_6rem_auto] items-center gap-3 pb-2' transition:slide={{ duration: 200 }}>
                    <Input bind:value={facilityWork} maxlength={200} aria-label='Facility work required' placeholder='Work required, e.g. new 208 V drop and exhaust duct' />
                    <Input bind:value={facilityLeadTime} aria-label='Facility work lead time in weeks' type='number' min='0' placeholder='Weeks' />
                    <span></span>
                    <Label for='{id}-facility-approved' class='font-[350] text-muted-foreground'>Facilities informed and approved the work</Label>
                    <span></span>
                    <Switch id='{id}-facility-approved' bind:checked={facilityApproved} />
                </div>
            {/if}
        {/each}
    </Field.Group>
</Field.Set>

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
