<script lang="ts">
    import * as Tabs from "$lib/components/tabs";
    import { Input } from "$lib/components/input";
    import { Label } from "$lib/components/label";
    import { Button } from "$lib/components/button";
    import { DatePicker } from "$lib/components/date-picker";
    import * as Field from "$lib/components/field";
    import * as RadioGroup from "$lib/components/radio-group";
    import * as ToggleGroup from "$lib/components/toggle-group";
    import * as InputGroup from "$lib/components/input-group";
    import * as Select from "$lib/components/select";
    import * as Attachment from "$lib/components/attachment";
    import { untrack, type Component } from "svelte";
    import { generateID } from "$lib/hooks/hash";
    import { slide } from "svelte/transition";
    import { parseDate } from "chrono-node";
    import { ArrowRight, TestTubeDiagonal, Factory, UserRoundPlus, Trash, Gauge, Hourglass, Replace, RotateCcw, Sparkles, Upload, FileText, X, Plus, Truck, DollarSign, Ellipsis, GraduationCap, Handshake, HardHat, Package, BadgeCheck, Undo2, Clock } from "@lucide/svelte";
    import Currency from "$lib/components/currency/currency.svelte";
    import { formatCurrency } from "$lib/hooks/finance";
    import { database } from "$lib/data/smartsheet.svelte";
    import {
        isLocked, stageOf, versionOf,
        parseBudget, parsePersonnel, parsePrograms, parseSpecs,
        serializeBudget, serializePersonnel, serializePrograms, serializeSpecs
    } from "$lib/data/snapshot-fields";
    import type { CostCategory, Firmness, Force, Location, NeedType, Personnel, PersonnelRole, PurchaseSnapshot } from "$lib/models/procurement";

    let { snapshot, onforward }: { snapshot: PurchaseSnapshot; onforward: () => void } = $props();

    // The parent re-mounts this component for each snapshot, so the form reads it once.
    const initial = untrack(() => $state.snapshot(snapshot));

    // Any decision from FAB Leadership locks this draft
    const locked = $derived(isLocked(snapshot));
    const stage = $derived(stageOf(snapshot));

    // When this draft exists because changes were requested, show what Leadership asked for
    const previous = $derived(database.get(`${snapshot.request_id}-${versionOf(snapshot) - 1}`));
    const requestedChanges = $derived(previous?.decision === "changes_requested" ? previous.decision_comments : null);


    // --- Where & why ---
    const locations: { value: Location; label: string; icon: Component }[] = [
        { value: "MER", label: "Microelectronics Research Center", icon: TestTubeDiagonal },
        { value: "MR2", label: "Montopolis Fabrication Bldg.", icon: Factory }
    ];

    const needTypes: { value: NeedType; label: string; hint: string; icon: Component }[] = [
        { value: "new_capability", label: "New capability", hint: "Something we can't do today", icon: Sparkles },
        { value: "replacement", label: "Replacement", hint: "Swap out an existing tool", icon: Replace },
        { value: "capacity", label: "More capacity", hint: "Demand is outgrowing what we have", icon: Gauge },
        { value: "end_of_life", label: "End of life", hint: "Vendor support is ending", icon: Hourglass },
        { value: "recurring_failure", label: "Keeps failing", hint: "Repeated downtime or repairs", icon: RotateCcw },
    ];

    let location: Location = $state(initial.location);
    let purpose = $state(initial.purpose);
    let needType: NeedType = $state(initial.purpose_type);
    let details = $state(initial.purpose_details ?? "");
    let gap = $state(initial.current_gap ?? "");


    // --- Programs ---
    let programs: string[] = $state(parsePrograms(initial.programs));
    let customProgram = $state("");

    const knownPrograms = ["PM6.2", "PM6.3", "PM6.4", "TV1", "TV2", "TV3", "LAX"];
    let programGroups = $state([
        { label: "Process Module", items: ["PM6.2", "PM6.3", "PM6.4"] },
        { label: "Test Vehicle", items: ["TV1", "TV2", "TV3"] },
        // Programs saved on this snapshot that aren't in the lists above still need a chip
        { label: "Other", items: ["LAX", ...programs.filter((p) => !knownPrograms.includes(p))] },
    ]);

    function addCustomProgram(e: KeyboardEvent) {
        if (e.key === "Enter" && customProgram.trim() !== "") {
            e.preventDefault();
            const prog = customProgram.trim().toUpperCase();
            if (!programGroups[2].items.includes(prog)) {
                programGroups[2].items.push(prog);
            }
            if (!programs.includes(prog)) {
                programs = [...programs, prog];
            }
            customProgram = "";
        }
    }


    // --- Personnel ---
    const roles: { value: PersonnelRole; label: string }[] = [
        { value: "equipment_owner", label: "Equipment owner" },
        { value: "requester", label: "Requester" },
        { value: "operator", label: "Operator" },
        { value: "backup_operator", label: "Backup operator" },
        { value: "maintenance", label: "Maintenance" },
    ];
    const roleLabel = (v: string) => roles.find((r) => r.value === v)?.label ?? "Choose a role";

    // `id` only keys the rows in the form; it isn't saved
    type Stakeholder = Personnel & { id: string };
    const newPerson = (role: PersonnelRole = "operator"): Stakeholder => ({ id: generateID(), name: "", email: "", role });

    const savedPeople = parsePersonnel(initial.personnel).map((p) => ({ ...p, id: generateID() }));
    let stakeholders: Stakeholder[] = $state(savedPeople.length ? savedPeople : [newPerson("equipment_owner")]);

    function addPerson() {
        stakeholders = [...stakeholders, newPerson()];
    }


    // --- Budget (form works in dollars, snapshot stores cents) ---
    const costItems: { key: CostCategory; label: string; icon: Component; placeholder: string }[] = [
        { key: "purchase", label: "Purchase Price", icon: DollarSign, placeholder: "280,000" },
        { key: "shipping", label: "Shipping & Freight", icon: Truck, placeholder: "10,000" },
        { key: "install_services", label: "Vendor Installation", icon: Replace, placeholder: "5,000" },
        { key: "fit_up", label: "Facility Fit-Up", icon: HardHat, placeholder: "15,000" },
        { key: "training", label: "Training", icon: GraduationCap, placeholder: "2,500" },
        { key: "spares", label: "Spare Parts", icon: Package, placeholder: "3,000" },
        { key: "service_contract", label: "Service Contract", icon: Handshake, placeholder: "7,500" },
        { key: "additional", label: "Additional Costs", icon: Ellipsis, placeholder: "0" },
    ];
    const optionalCosts = costItems.filter((c) => c.key !== "purchase");

    let receipt: Partial<Record<CostCategory, number>> = $state(
        Object.fromEntries(Object.entries(parseBudget(initial.budget)).map(([key, cents]) => [key, (cents ?? 0) / 100]))
    );
    let costsCategories: string[] = $state(Object.keys(receipt).filter((k) => k !== "purchase"));

    // Deselected categories keep their value but are left out of the total and the save
    const activeCosts = $derived(costItems.filter((c) => c.key === "purchase" || costsCategories.includes(c.key)));
    const estimate: number = $derived(activeCosts.reduce((sum, c) => sum + (receipt[c.key] ?? 0), 0));


    // --- Specs ---
    const defaultSpecs = [
        { id: "footprint", label: "Footprint / Dimensions", placeholder: "e.g., 2.5m x 1.8m" },
        { id: "throughput", label: "Throughput", placeholder: "e.g., 100 WPH" },
        { id: "accuracy", label: "Accuracy", placeholder: "e.g., ±0.5 µm" },
        { id: "power", label: "Power Requirements", placeholder: "e.g., 208V 3-phase" },
        { id: "weight", label: "Weight", placeholder: "e.g., 1500 kg" }
    ];
    const defaultSpecFor = (title: string) => defaultSpecs.find((d) => d.label === title);
    const savedSpecs = parseSpecs(initial.specs);

    let activeSpecs: string[] = $state(savedSpecs.flatMap((s) => defaultSpecFor(s.title)?.id ?? []));
    let specValues: Record<string, string> = $state(
        Object.fromEntries(savedSpecs.flatMap((s) => {
            const spec = defaultSpecFor(s.title);
            return spec ? [[spec.id, s.value]] : [];
        }))
    );

    type CustomSpec = { title: string; value: string; placeholder: string };
    let newSpecTitle = $state("");
    let newSpecUnit = $state("");
    let customSpecs: CustomSpec[] = $state(
        savedSpecs.filter((s) => !defaultSpecFor(s.title)).map((s) => ({ ...s, placeholder: s.value }))
    );

    function addNewSpecification() {
        if (!newSpecTitle || !newSpecUnit) return;
        customSpecs = [...customSpecs, { value: newSpecUnit, title: newSpecTitle, placeholder: newSpecUnit }];
        newSpecTitle = "";
        newSpecUnit = "";
    }


    // --- Timeline (DatePicker shows "December 31, 2026", snapshot stores "2026-12-31") ---
    function displayDate(iso: string) {
        const [y, m, d] = iso.split("-").map(Number);
        return new Date(y, m - 1, d).toLocaleDateString("en-US", { day: "2-digit", month: "long", year: "numeric" });
    }

    function isoDate(display: string) {
        const date = parseDate(display);
        if (!date) return initial.target_date;
        const pad = (n: number) => String(n).padStart(2, "0");
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    }

    let due = $state(displayDate(initial.target_date));
    let consequence = $state(initial.consequence ?? "");
    let firmness: Firmness = $state(initial.date_firmness);
    let force: Force = $state(initial.date_force);


    // --- Attachments (kept in the browser only; files aren't saved to the snapshot yet) ---
    let dragging = $state(false);
    const fileSize = (n: number) => (n > 1_048_576 ? `${(n / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
    const fileKind = (f: File) => (f.name.split(".").pop() ?? "file").toUpperCase();
    let files: File[] = $state([]);

    function addFiles(list: FileList | null) {
        if (!list) return;
        const known = new Set(files.map((f) => `${f.name}:${f.size}`));
        files = [...files, ...Array.from(list).filter((f) => !known.has(`${f.name}:${f.size}`))];
    }


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
            budget: serializeBudget(Object.fromEntries(activeCosts.map((c) => [c.key, (receipt[c.key] ?? 0) * 100]))),
            target_date: isoDate(due),
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
        if (json === lastSaved || isLocked(snapshot)) return;
        lastSaved = json;
        database.update(snapshot.id, patch);
    }

    $effect(() => {
        fields();           // track every form field
        untrack(save);
    });


    // --- Validation & forwarding ---
    let touched = $state({ location: false, purpose: false, gap: false, personnel: false, purchase: false });
    let submitted = $state(false);

    let errors = $derived({
        location: (touched.location || submitted) && !location ? "A location must be selected." : null,
        purpose: (touched.purpose || submitted) && purpose.trim() === "" ? "Equipment name / purpose is required." : null,
        gap: (touched.gap || submitted) && gap.trim() === "" ? "Please explain the current gap this solves." : null,
        personnel: (touched.personnel || submitted) && stakeholders.filter(s => s.name.trim() !== "").length === 0 ? "At least one named personnel is required." : null,
        purchase: (touched.purchase || submitted) && (!receipt.purchase || receipt.purchase <= 0) ? "An estimated purchase price is required." : null
    });

    function forwardProposal() {
        if (locked || snapshot.forwarded) return;

        submitted = true;
        if (Object.values(errors).some(err => err !== null)) return;

        save();
        database.forward(snapshot.id);
        onforward();
    }

    const chip = "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary";
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
                    <dd class="text-right font-medium uppercase">{ locations.find((l) => l.value === location)?.label ?? "Not set" }</dd>
                    <dt class="text-muted-foreground">Purpose</dt>
                    <dd class="text-right font-medium">{ purpose.length > 0 ? purpose : "Not set" }</dd>
                    <dt class="text-muted-foreground">Programs</dt>
                    <dd class="text-right font-medium">{ programs.length ? programs.join(", ") : "Not set" }</dd>
                    <dt class="text-muted-foreground">Estimated cost</dt>
                    <dd class="text-right font-medium tabular-nums">{ estimate > 0 ? formatCurrency(estimate) : "Not set" }</dd>
                    <dt class="text-muted-foreground">Needed by</dt>
                    <dd class="text-right font-medium">{ due }</dd>
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

        <!-- Location -->
        <Field.Set>
            <Field.Legend class='font-medium text-lg mb-1'>Location</Field.Legend>
            <Field.Description>Where will this equipment be used?</Field.Description>
            
            <RadioGroup.Root bind:value={location} disabled={locked} onfocusout={() => touched.location = true} class='grid grid-cols-2 gap-4 mt-4'>
                {#each locations as { value, label, icon: Icon }}
                    <Label
                        for={`loc-${value}`}
                        class={`flex flex-col gap-2 items-start border p-4 bg-accent opacity-50 font-medium transition-all
                        data-[selected=true]:bg-white data-[selected=true]:shadow-md data-[selected=true]:text-slate-700 data-[selected=true]:opacity-100
                        ${errors.location ? 'border-destructive' : ''}
                        ${locked ? 'pointer-events-none' : 'cursor-pointer hover:opacity-100'}`}
                        data-selected={ value === location }>
                        <RadioGroup.Item id={`loc-${value}`} class='sr-only' {value} disabled={locked} />
                        <Icon class='size-6 stroke-1' />
                        <strong class='mt-2'>{ label }</strong>
                        <p class='font-normal uppercase'>{ value }</p>
                    </Label>
                {/each}
            </RadioGroup.Root>
            {#if errors.location}
                <Field.Error>{errors.location}</Field.Error>
            {/if}
        </Field.Set>
        {@render Divider()}

        <!-- Purpose -->
        <Field.Field>
            <Field.Label for="purpose" class='font-medium text-lg'>Purpose</Field.Label>
            <Field.Description>What is this equipment for? Does it enable any new technology or process that isn't currently available?</Field.Description>
            
            <Input 
                bind:value={purpose} 
                id='purpose' 
                type='text' 
                disabled={locked}
                onblur={() => touched.purpose = true} 
                placeholder='Wafer Based Plasma Dicer' 
                class={["", errors.purpose && 'border-destructive']} 
            />
            {#if errors.purpose}
                <Field.Error class="mb-4">{errors.purpose}</Field.Error>
            {/if}
        </Field.Field>
        <br>

        <Field.Set>
            <Field.Legend variant="label">What kind of need is it?</Field.Legend>
            <RadioGroup.Root bind:value={needType} disabled={locked} class="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {#each needTypes as n (n.value)}
                    {@render Choice(n.value, needType, n.label, n.hint, n.icon)}
                {/each}
            </RadioGroup.Root>
        </Field.Set>
        <br>

        <Field.Field>
            <Field.Label for="details">What will it do, and why do we need it?</Field.Label>
            <InputGroup.Root>
                <InputGroup.Textarea
                    id="details"
                    bind:value={details}
                    disabled={locked}
                    maxlength={300}
                    class="min-h-20 resize-none"
                    placeholder={"Supports C4 bumping when pitch is 200 µm or more.\nSeveral customers are asking for 4 to 16 mil spheres, SnPb and SnAg."} />
                {@render Count(details, 300)}
            </InputGroup.Root>
        </Field.Field>
        <br>

        <Field.Field>
            <Field.Label for="gap">What can't you do today that this fixes?</Field.Label>
            <InputGroup.Root>
                <InputGroup.Textarea
                    id="gap"
                    bind:value={gap}
                    disabled={locked}
                    maxlength={200}
                    onblur={() => touched.gap = true}
                    class={["min-h-20 resize-none", errors.gap && 'border-destructive']}
                    placeholder="Bumping is manual, slow, and error-prone. This automates it and raises throughput." />
                {@render Count(gap, 200)}
            </InputGroup.Root>
            {#if errors.gap}
                <Field.Error class="mt-2">{errors.gap}</Field.Error>
            {/if}
        </Field.Field>

        {@render Divider()}

        <!-- Programs -->
        <Field.Set>
            <Field.Legend class='font-medium text-lg mb-1'>Programs it supports</Field.Legend>
            <Field.Description>Pick every program that will use it or manually type to add.</Field.Description>
            
            <ToggleGroup.Root type="multiple" disabled={locked} variant="outline" size="sm" spacing={2} bind:value={programs} class="w-full flex-col items-start gap-4 mt-4">
                {#each programGroups as group (group.label)}
                    <div class="flex flex-wrap items-center gap-2">
                        <span class="w-28 text-sm text-muted-foreground">{group.label}</span>
                        {#each group.items as p (p)}
                            <ToggleGroup.Item value={p} class={chip} disabled={locked}>{p}</ToggleGroup.Item>
                        {/each}
                    </div>
                {/each}
            </ToggleGroup.Root>
            <div class="mt-4 w-full sm:w-1/2">
                <Label for="customProgram" class="sr-only">Add custom program</Label>
                <Input id="customProgram" bind:value={customProgram} disabled={locked} onkeydown={addCustomProgram} placeholder="Type program and hit Enter to add" />
            </div>
        </Field.Set>
        {@render Divider()}

        <!-- Personnel -->
        <Field.Set>
            <Field.Legend class='font-medium text-lg mb-1'>Personnel</Field.Legend>
            <Field.Description>Who will be responsible for operating and maintaining this equipment?</Field.Description>
            
            <div class="space-y-2 mt-4" onfocusout={() => touched.personnel = true}>
                <Field.Legend variant="label">Who will own, run, and maintain it?</Field.Legend>
                {#each stakeholders as s (s.id)}
                    <div class="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[1fr_1fr_11rem_auto]" transition:slide>
                        <Input bind:value={s.name} disabled={locked} autocomplete="off" aria-label="Name" placeholder="Sugento Huandra" class={errors.personnel ? 'border-destructive' : ''} />
                        <Input bind:value={s.email} disabled={locked} type="email" autocomplete="off" aria-label="Email" placeholder="sugento_huandra@txie.org" />
                        <Select.Root type="single" bind:value={s.role} disabled={locked}>
                            <Select.Trigger class="w-full" aria-label="Role">{roleLabel(s.role)}</Select.Trigger>
                            <Select.Content class='rounded-none'>
                                {#each roles as r (r.value)}<Select.Item value={r.value} label={r.label} />{/each}
                            </Select.Content>
                        </Select.Root>
                        <Button size="icon" variant="ghost" disabled={locked} aria-label="Remove person" onclick={() => (stakeholders = stakeholders.filter((x) => x.id !== s.id))}>
                            <Trash class="size-4" />
                        </Button>
                    </div>
                {/each}
            </div>
            
            <Button size="sm" variant="outline" disabled={locked} class="w-max gap-2 mt-2 mb-2" onclick={addPerson}><UserRoundPlus class="size-4" /> Add person</Button>
            {#if errors.personnel}
                <Field.Error>{errors.personnel}</Field.Error>
            {/if}
        </Field.Set>
        {@render Divider()}

        <!-- Budget -->
        <Field.Set>
            <Field.Legend class='font-medium text-lg mb-1'>Budget</Field.Legend>
            <Field.Description>Provide estimates on what it will cost to acquire and install this equipment. Ballpark estimates are fine, real quotes will be used after approval.</Field.Description>
            
            <ToggleGroup.Root class='flex flex-wrap' type="multiple" disabled={locked} variant="outline" size="sm" spacing={2} bind:value={costsCategories}>
                {#each optionalCosts as c (c.key)}
                    <ToggleGroup.Item value={c.key} class={chip} disabled={locked}>{c.label}</ToggleGroup.Item>
                {/each}
            </ToggleGroup.Root>

            <div class='grid grid-cols-[auto_1fr_2fr] items-end gap-x-3 gap-y-2' onfocusout={() => touched.purchase = true}>
                {#each activeCosts as c (c.key)}
                    <c.icon class='size-5 text-muted-foreground' />
                    <Label class='pb-1'>{c.label}</Label>
                    <Currency bind:value={receipt[c.key]} disabled={locked} placeholder={c.placeholder} variant='underline' />

                    {#if c.key === "purchase" && errors.purchase}
                        <div class="col-span-3">
                            <Field.Error>{errors.purchase}</Field.Error>
                        </div>
                    {/if}
                {/each}
            </div>
            
            <div class='grid grid-cols-[1fr_auto] gap-2 items-end mt-6'>
                <p class='text-end'>Total estimated cost:</p>
                <strong class='text-xl font-medium'>{ formatCurrency(estimate) }</strong>
            </div>
        </Field.Set>
        {@render Divider()}

        <!-- Target Specifications & Capabilities -->
        <Field.Set>
            <Field.Legend class='font-medium text-lg mb-1'>Target Specifications & Capabilities</Field.Legend>
            <Field.Description>Select the specs required and outline the targets they must hit.</Field.Description>
            
            <ToggleGroup.Root class='flex flex-wrap' type="multiple" disabled={locked} variant="outline" size="sm" spacing={2} bind:value={activeSpecs}>
                {#each defaultSpecs as spec}
                    <ToggleGroup.Item value={spec.id} class={chip} disabled={locked}>{spec.label}</ToggleGroup.Item>
                {/each}
            </ToggleGroup.Root>

            <div class='grid grid-cols-[1fr_2fr_auto] items-center gap-x-8 gap-y-1 mt-4' transition:slide>
                {#each defaultSpecs.filter(s => activeSpecs.includes(s.id)) as spec}
                    <strong class="text-sm">{spec.label}</strong>
                    <Input variant='underline' bind:value={specValues[spec.id]} disabled={locked} placeholder={spec.placeholder} class='h-8' />
                    <div class="size-8"></div>
                {/each}
                
                {#each customSpecs as spec, i}
                    <strong class="text-sm">{spec.title}</strong>
                    <Input variant='underline' bind:value={customSpecs[i].value} disabled={locked} placeholder={spec.placeholder} class='h-8' />
                    <Button class='size-8' variant='ghost' disabled={locked} aria-label="Remove spec" onclick={() => customSpecs = customSpecs.filter((_, idx) => idx !== i)}><Trash /></Button>
                {/each}
                
                <Input variant='underline' bind:value={newSpecTitle} disabled={locked} class='px-0 shadow-transparent text-sm font-medium' placeholder='Add custom spec...' />
                <Input variant='underline' bind:value={newSpecUnit} disabled={locked} placeholder='Value or unit' />
                <Button class='size-8' variant={(!newSpecTitle || !newSpecUnit) ? 'ghost' : 'default'} disabled={locked || !newSpecTitle || !newSpecUnit} onclick={addNewSpecification}><Plus /></Button>
            </div>
        </Field.Set>
        {@render Divider()}

        <!-- Target Operational Date -->
        <Field.Set>
            <Field.Legend class='font-medium text-lg mb-1'>Target Operational Date</Field.Legend>
            <Field.Description>When do you need this tool installed & operational by? Approximate date is fine.</Field.Description>
            
            <Field.Field >
                <Field.Label for='due'>Installed & operational by</Field.Label>
                <DatePicker bind:inputValue={due} disabled={locked} />
            </Field.Field>

            <Field.Field>
                <Field.Label for="consequence">What happens if it's late?</Field.Label>
                <Input id="consequence" bind:value={consequence} disabled={locked} maxlength={140} placeholder="We miss the July milestones for the new product line." />
            </Field.Field>
            
            <div class='grid grid-cols-1 lg:grid-cols-2 gap-x-2 gap-y-2'>
                <Label>How firm is that date?</Label>

                <ToggleGroup.Root type="single" disabled={locked} variant="outline" size="sm" spacing={2} bind:value={firmness} class="justify-start">
                    <ToggleGroup.Item value="hard" class={chip} disabled={locked}>Hard deadline</ToggleGroup.Item>
                    <ToggleGroup.Item value="target" class={chip} disabled={locked}>Target</ToggleGroup.Item>
                    <ToggleGroup.Item value="flexible" class={chip} disabled={locked}>Flexible</ToggleGroup.Item>
                </ToggleGroup.Root>

                <Label>Is something forcing the timeline?</Label>
                <ToggleGroup.Root type="single" disabled={locked} variant="outline" size="sm" spacing={2} bind:value={force} class="justify-start">
                    <ToggleGroup.Item value="none" class={chip} disabled={locked}>No</ToggleGroup.Item>
                    <ToggleGroup.Item value="expedited" class={chip} disabled={locked}>Time-limited offer</ToggleGroup.Item>
                    <ToggleGroup.Item value="emergency" class={chip} disabled={locked}>A tool is down</ToggleGroup.Item>
                </ToggleGroup.Root> 
            </div>
        </Field.Set>
        {@render Divider()}

        <!-- Attachments -->
        <Field.Set>
            <Field.Legend class="font-medium text-lg mb-1">Attachments</Field.Legend>
            <Field.Description>Add any additional files (e.g. quotes, datasheets, or emails)</Field.Description>
            <label
                class={["flex flex-col items-center gap-1.5 border border-dashed p-6 text-center text-sm transition-colors mt-4",
                locked ? "opacity-50 pointer-events-none" : "cursor-pointer hover:bg-accent/50 has-focus-visible:ring-2 has-focus-visible:ring-ring", 
                dragging && "bg-accent"]}
                ondragover={(e) => { if(locked) return; e.preventDefault(); dragging = true; }}
                ondragleave={() => { if(locked) return; dragging = false; }}
                ondrop={(e) => { if(locked) return; e.preventDefault(); dragging = false; addFiles(e.dataTransfer?.files ?? null); }}>
                <Upload class="size-5 stroke-[1.5]" />
                <span class="font-medium">Drop files here</span>
                <span class="text-muted-foreground">or click to browse</span>
                <input type="file" multiple class="sr-only" disabled={locked} onchange={(e) => { addFiles(e.currentTarget.files); e.currentTarget.value = ""; }} />
            </label>
            {#if files.length}
                <div class="flex flex-col gap-2 mt-4">
                    {#each files as f, i (f.name + f.size + f.lastModified)}
                        <Attachment.Root state="idle" size="sm" class="w-full">
                            <Attachment.Media><FileText /></Attachment.Media>
                            <Attachment.Content>
                                <Attachment.Title>{f.name}</Attachment.Title>
                                <Attachment.Description>{fileKind(f)} {fileSize(f.size)}</Attachment.Description>
                            </Attachment.Content>
                            <Attachment.Actions>
                                <Attachment.Action aria-label="Remove {f.name}" disabled={locked} onclick={() => (files = files.filter((_, j) => j !== i))}><X /></Attachment.Action>
                            </Attachment.Actions>
                        </Attachment.Root>
                    {/each}
                </div>
            {/if}
        </Field.Set>
        <br>
        <br>
        <br>

        <Button
            onclick={forwardProposal}
            variant={stage === 'rejected' ? 'destructive' : 'default'}
            class='ml-auto flex items-center gap-3'
            disabled={locked || snapshot.forwarded}
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
                Forward Proposal to FAB Leadership <ArrowRight class='stroke-[1.5]' />
            {/if}
        </Button>

    </article>
</Tabs.Content>

{#snippet Divider()}
    <br>
    <hr class='border-[0.5px] border-dashed'>
    <br>
{/snippet}

{#snippet Choice(value: string, current: string, label: string, hint: string, Icon: Component)}
    <Label for={`need-${value}`} data-selected={value === current} class={
        `flex flex-col items-start gap-1.5 border px-4 py-4 bg-accent/60 opacity-60 transition-all 
        has-focus-visible:ring-2 has-focus-visible:ring-ring 
        data-[selected=true]:bg-background data-[selected=true]:shadow-md data-[selected=true]:opacity-100 data-[selected=true]:border-foreground/30
        ${locked ? 'pointer-events-none' : 'cursor-pointer hover:opacity-100'}`
    }>
        <Icon class='size-5 row-span-2' />
        <strong class="mt-1 font-medium">{ label }</strong>
        <p class="text-sm font-normal text-muted-foreground">{ hint }</p>
        <RadioGroup.Item id={`need-${value}`} class="sr-only" {value} disabled={locked} />
    </Label>
{/snippet}

{#snippet Count(value: string, max: number)}
    <InputGroup.Addon align="block-end">
        <InputGroup.Text class="ms-auto text-xs tabular-nums">{max - value.length} left</InputGroup.Text>
    </InputGroup.Addon>
{/snippet}