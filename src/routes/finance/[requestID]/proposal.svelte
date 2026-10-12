<script lang="ts">
    import { untrack } from "svelte";
    import { getLocalTimeZone, parseDate, type DateValue } from "@internationalized/date";
    import { ArrowRight, BadgeCheck, Clock, Undo2, X } from "@lucide/svelte";
    import * as Tabs from "$lib/components/tabs";
    import { Button } from "$lib/components/button";
    import * as Field from "$lib/components/field";
    import { formatCurrency } from "$lib/hooks/finance";
    import { generateID } from "$lib/hooks/hash";
    import { database } from "$lib/data/smartsheet.svelte";
    import { locationLabel } from "$lib/data/labels";
    import {
        isLocked, stageOf, versionOf,
        parsePersonnel, parsePrograms, parseSpecs,
        serializeBudget, serializePersonnel, serializePrograms, serializeSpecs
    } from "$lib/data/snapshot-fields";
    import type { Firmness, Force, Location, NeedType, PurchaseSnapshot } from "$lib/models/procurement";
    import { activeCents, activeTotal, budgetDollars, defaultSpecs, savedCategories } from "../fields/options";
    import LocationField from "../fields/location.svelte";
    import PurposeField from "../fields/purpose.svelte";
    import ProgramsField from "../fields/programs.svelte";
    import PersonnelField, { newPerson, type Stakeholder } from "../fields/personnel.svelte";
    import CostsField from "../fields/costs.svelte";
    import SpecsField, { type CustomSpec } from "../fields/specs.svelte";
    import TimelineField from "../fields/timeline.svelte";
    import AttachmentsField from "../fields/attachments.svelte";
    import ProposalView from "./proposal-view.svelte";

    let { snapshot, onnext }: { snapshot: PurchaseSnapshot; onnext: () => void } = $props();

    // The parent re-mounts this component for each snapshot, so the form reads it once.
    const initial = untrack(() => $state.snapshot(snapshot));

    // Forwarding to FAB Leadership or recording a decision makes the proposal read only.
    const locked = $derived(snapshot.forwarded || isLocked(snapshot));
    const stage = $derived(stageOf(snapshot));

    // When this draft exists because changes were requested, show what Leadership asked for
    const previous = $derived(database.get(`${snapshot.request_id}-${versionOf(snapshot) - 1}`));
    const requestedChanges = $derived(previous?.decision === "changes_requested" ? previous.decision_comments : null);


    // --- Where & why ---
    let location: Location = $state(initial.location);
    let purpose = $state(initial.purpose);
    let needType: NeedType = $state(initial.purpose_type);
    let details = $state(initial.purpose_details ?? "");
    let gap = $state(initial.current_gap ?? "");


    // --- Programs & personnel ---
    let programs: string[] = $state(parsePrograms(initial.programs));

    const savedPeople = parsePersonnel(initial.personnel).map((p) => ({ ...p, id: generateID() }));
    let stakeholders: Stakeholder[] = $state(savedPeople.length ? savedPeople : [newPerson("equipment_owner")]);


    // --- Budget (form works in dollars, snapshot stores cents) ---
    const savedBudget = budgetDollars(initial.budget);
    let receipt = $state(savedBudget);
    let costCategories: string[] = $state(savedCategories(savedBudget));
    const estimate = $derived(activeTotal(receipt, costCategories));


    // --- Specs ---
    const defaultSpecFor = (title: string) => defaultSpecs.find((d) => d.label === title);
    const savedSpecs = parseSpecs(initial.specs);

    let activeSpecs: string[] = $state(savedSpecs.flatMap((s) => defaultSpecFor(s.title)?.id ?? []));
    let specValues: Record<string, string> = $state(
        Object.fromEntries(savedSpecs.flatMap((s) => {
            const spec = defaultSpecFor(s.title);
            return spec ? [[spec.id, s.value]] : [];
        }))
    );
    let customSpecs: CustomSpec[] = $state(
        savedSpecs.filter((s) => !defaultSpecFor(s.title)).map((s) => ({ ...s, placeholder: s.value }))
    );


    // --- Timeline (DatePicker works in DateValues, snapshot stores "2026-12-31") ---
    let due = $state<DateValue | undefined>(parseDate(initial.target_date));
    let consequence = $state(initial.consequence ?? "");
    let firmness: Firmness = $state(initial.date_firmness);
    let force: Force = $state(initial.date_force);

    function displayDate(date: DateValue) {
        return date.toDate(getLocalTimeZone()).toLocaleDateString("en-US", { day: "2-digit", month: "long", year: "numeric" });
    }


    // --- Attachments (kept in the browser only; files aren't saved to the snapshot yet) ---
    let files: File[] = $state([]);


    // --- Saving ---
    /** The form, in the snapshot's field formats. */
    function fields() {
        return {
            location,
            purpose,
            purpose_type: needType,
            purpose_details: details || null,
            current_gap: gap || null,
            programs: serializePrograms(programs),
            personnel: serializePersonnel(stakeholders),
            specs: serializeSpecs([
                ...defaultSpecs.filter((s) => activeSpecs.includes(s.id)).map((s) => ({ title: s.label, value: specValues[s.id] ?? "" })),
                ...customSpecs.map(({ title, value }) => ({ title, value }))
            ]),
            budget: serializeBudget(activeCents(receipt, costCategories)),
            target_date: due?.toString() ?? initial.target_date,
            date_firmness: firmness,
            date_force: force,
            consequence: consequence || null,
        };
    }

    // Auto-save while the draft is editable. Starts from the loaded form so opening a draft doesn't touch it.
    let lastSaved = JSON.stringify(fields());

    function save() {
        const patch = fields();
        const json = JSON.stringify(patch);
        if (json === lastSaved || locked) return;
        lastSaved = json;
        database.update(snapshot.id, patch);
    }

    $effect(() => {
        fields();           // track every form field
        untrack(save);
    });


    // --- Validation (the same rules gate forwarding in Sourcing, see isProposalComplete) ---
    let touched = $state({ location: false, purpose: false, gap: false, personnel: false, purchase: false });
    let submitted = $state(false);

    let errors = $derived({
        location: (touched.location || submitted) && !location ? "A location must be selected." : null,
        purpose: (touched.purpose || submitted) && purpose.trim() === "" ? "Equipment name / purpose is required." : null,
        gap: (touched.gap || submitted) && gap.trim() === "" ? "Please explain the current gap this solves." : null,
        personnel: (touched.personnel || submitted) && stakeholders.filter(s => s.name.trim() !== "").length === 0 ? "At least one named personnel is required." : null,
        purchase: (touched.purchase || submitted) && (!receipt.purchase || receipt.purchase <= 0) ? "An estimated purchase price is required." : null
    });

    function continueToSourcing() {
        if (locked) return;

        submitted = true;
        if (Object.values(errors).some(err => err !== null)) return;

        save();
        onnext();
    }
</script>

<Tabs.Content value="proposal" class='gap-x-8 grid grid-cols-1 md:grid-cols-2 px-[5vw] w-full mx-auto max-w-8xl'>
    <aside>
        <div class='grid grid-rows-[auto_1fr_auto] md:sticky top-0 py-20 md:pt-28 h-auto md:h-screen pr-16'>
            <div>
                <h1 class='text-2xl font-medium font-display'>01 - Proposal</h1>
            </div>
            <br>
            <div>
                <dl class="hidden grid-cols-2 gap-y-2 border-t pt-4 text-sm md:grid">
                    <dt class="text-muted-foreground">Location</dt>
                    <dd class="text-right font-medium uppercase">{ locationLabel[location] ?? "Not set" }</dd>
                    <dt class="text-muted-foreground">Purpose</dt>
                    <dd class="text-right font-medium">{ purpose.length > 0 ? purpose : "Not set" }</dd>
                    <dt class="text-muted-foreground">Programs</dt>
                    <dd class="text-right font-medium">{ programs.length ? programs.join(", ") : "Not set" }</dd>
                    <dt class="text-muted-foreground">Estimated cost</dt>
                    <dd class="text-right font-medium tabular-nums">{ estimate > 0 ? formatCurrency(estimate) : "Not set" }</dd>
                    <dt class="text-muted-foreground">Needed by</dt>
                    <dd class="text-right font-medium">{ due ? displayDate(due) : "Not set" }</dd>
                    <dt class="text-muted-foreground">Draft</dt>
                    <dd class="text-right font-medium">{ snapshot.request_id } · v{ versionOf(snapshot) }</dd>
                </dl>
            </div>
        </div>
    </aside>

    <article class='md:pt-28 pb-20'>
        {#if requestedChanges && !locked}
            <div class='border border-orange-300 bg-orange-50 dark:bg-orange-950/40 p-4 mb-8 text-sm'>
                <strong class='flex items-center gap-2 font-medium mb-1'><Undo2 class='size-4' /> FAB Leadership requested changes on draft { versionOf(previous!) }</strong>
                <p class='whitespace-pre-wrap'>{ requestedChanges }</p>
            </div>
        {/if}

        {#if locked}
            <ProposalView {snapshot} />
        {:else}
            <LocationField bind:value={location} error={errors.location} ontouch={() => (touched.location = true)} />
            {@render Divider()}

            <PurposeField bind:purpose bind:needType bind:details bind:gap {errors} ontouch={(field) => (touched[field] = true)} />
            {@render Divider()}

            <ProgramsField bind:value={programs} />
            {@render Divider()}

            <PersonnelField bind:value={stakeholders} error={errors.personnel} ontouch={() => (touched.personnel = true)} />
            {@render Divider()}

            <Field.Set>
                <Field.Legend class='font-medium text-lg mb-1'>Budget</Field.Legend>
                <Field.Description>Provide estimates on what it will cost to acquire and install this equipment. Ballpark estimates are fine, real quotes are gathered in Sourcing.</Field.Description>

                <CostsField bind:amounts={receipt} bind:categories={costCategories} error={errors.purchase} ontouch={() => (touched.purchase = true)} />

                <div class='grid grid-cols-[1fr_auto] gap-2 items-end mt-6'>
                    <p class='text-end'>Total estimated cost:</p>
                    <strong class='text-xl font-medium'>{ formatCurrency(estimate) }</strong>
                </div>
            </Field.Set>
            {@render Divider()}

            <SpecsField bind:active={activeSpecs} bind:values={specValues} bind:custom={customSpecs} />
            {@render Divider()}

            <TimelineField bind:due bind:consequence bind:firmness bind:force />
            {@render Divider()}

            <AttachmentsField bind:files />
        {/if}
        <br>
        <br>
        <br>

        <Button
            onclick={continueToSourcing}
            variant={stage === 'rejected' ? 'destructive' : 'default'}
            class='ml-auto flex items-center gap-3'
            disabled={locked}
        >
            {#if stage === 'approved'}
                Proposal Approved <BadgeCheck class='stroke-[1.5]' />
            {:else if stage === 'rejected'}
                Proposal Rejected <X class='stroke-[1.5]' />
            {:else if stage === 'changes_requested'}
                Changes Requested — continued in a new draft <Undo2 class='stroke-[1.5]' />
            {:else if stage === 'fab_leadership_review'}
                Awaiting FAB Leadership <Clock class='stroke-[1.5]' />
            {:else}
                Continue to Sourcing <ArrowRight class='stroke-[1.5]' />
            {/if}
        </Button>
    </article>
</Tabs.Content>

{#snippet Divider()}
    <br>
    <hr class='border-[0.5px] border-dashed'>
    <br>
{/snippet}
