<script lang="ts">
    import { slide } from "svelte/transition";
    import * as Field from "$lib/components/field";
    import { Input } from "$lib/components/input";
    import { Label } from "$lib/components/label";
    import { Switch } from "$lib/components/switch";
    import type { VendorFlag } from "$lib/models/procurement";
    import { flags as flagOptions } from "./options";

    /** The facility work fields only show (and the parent only saves them) while `facility_modification` is on */
    let {
        id,
        flags = $bindable(),
        work = $bindable(),
        workLeadTime = $bindable(),
        workApproved = $bindable(),
    }: {
        id: string;
        flags: Record<VendorFlag, boolean>;
        work: string;
        workLeadTime: number | null;
        workApproved: boolean;
    } = $props();
</script>

<Field.Set>
    <Field.Legend variant='label'>Do any of these apply for the equipment?</Field.Legend>
    <Field.Group class='grid items-center grid-cols-[auto_1fr_auto] gap-3'>
        {#each flagOptions as flag (flag.key)}
            <flag.icon class='size-5 stroke-[1.2]' />
            <Label for='{id}-flag-{flag.key}' class='font-[350]'>{flag.label}</Label>
            <Switch id='{id}-flag-{flag.key}' bind:checked={flags[flag.key]} />
            {#if flag.key === 'facility_modification' && flags.facility_modification}
                <div class='col-start-2 col-span-2 grid grid-cols-[1fr_6rem_auto] items-center gap-3 pb-2' transition:slide={{ duration: 200 }}>
                    <Input bind:value={work} maxlength={200} aria-label='Facility work required' placeholder='Work required, e.g. new 208 V drop and exhaust duct' />
                    <Input bind:value={workLeadTime} aria-label='Facility work lead time in weeks' type='number' min='0' placeholder='Weeks' />
                    <span></span>
                    <Label for='{id}-facility-approved' class='font-[350] text-muted-foreground'>Facilities informed and approved the work</Label>
                    <span></span>
                    <Switch id='{id}-facility-approved' bind:checked={workApproved} />
                </div>
            {/if}
        {/each}
    </Field.Group>
</Field.Set>
