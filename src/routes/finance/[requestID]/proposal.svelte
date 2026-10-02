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
    import type { Component } from "svelte";
    import { generateID } from "$lib/hooks/hash";
    import { slide } from "svelte/transition";
    import { ArrowRight, TestTubeDiagonal, Factory, UserRoundPlus, Trash, Gauge, Hourglass, Replace, RotateCcw, Sparkles, Upload, FileText, X, Plus, Truck, DollarSign, Ellipsis, GraduationCap, Handshake, HardHat, Package, BadgeCheck } from "@lucide/svelte";
    import Currency from "$lib/components/currency/currency.svelte";
    import { formatCurrency } from "$lib/hooks/finance";
    
    // Import the database to commit changes
    import { database } from "$lib/data/procurement.svelte";
    import type { NeedType, Personnel } from "$lib/models/procurement";

    let {
        tab = $bindable() as string,
        snapshot = $bindable() as Record<string, any>,
        request // Incoming parent request
    } = $props();

    function get3MonthsFromNow() {
        const d = new Date();
        d.setMonth(d.getMonth() + 3);
        return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }

    // --- State Hydration ---
    // Initialize form states using the incoming snapshot payload
    let purpose = $state(snapshot?.purpose || "");
    let details = $state(snapshot?.details || "");
    let location: "mer" | "mr2" | "" = $state(snapshot?.location || "");
    let needType: NeedType = $state(snapshot?.need_type || "");
    let gap = $state(snapshot?.gap || "");
    let programs: string[] = $state(snapshot?.programs || []);
    let customProgram = $state(""); 
    
    let locations = [
        { value: "mer", label: "Microelectronics Research Center", icon: TestTubeDiagonal },
        { value: "mr2", label: "Montopolis Fabrication Bldg.", icon: Factory }
    ];

    const needTypes = [
        { value: "new_capability", label: "New capability", hint: "Something we can't do today", icon: Sparkles },
        { value: "replacement", label: "Replacement", hint: "Swap out an existing tool", icon: Replace },
        { value: "capacity", label: "More capacity", hint: "Demand is outgrowing what we have", icon: Gauge },
        { value: "end_of_life", label: "End of life", hint: "Vendor support is ending", icon: Hourglass },
        { value: "recurring_failure", label: "Keeps failing", hint: "Repeated downtime or repairs", icon: RotateCcw },
    ];

    let programGroups = $state([
        { label: "Process Module", items: ["PM6.2", "PM6.3", "PM6.4"] },
        { label: "Test Vehicle", items: ["TV1", "TV2", "TV3"] },
        { label: "Other", items: ["LAX"] },
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

    const roles = [
        { value: "equipment_owner", label: "Equipment owner" },
        { value: "operator", label: "Operator" },
        { value: "backup_operator", label: "Backup operator" },
        { value: "maintenance", label: "Maintenance" },
    ];

    // Hydrate personnel or fall back to empty row
    let stakeholders: Personnel[] = $state(snapshot?.personnel);
    const roleLabel = (v: string) => roles.find((r) => r.value === v)?.label ?? "Choose a role";

    function addPerson() {
        stakeholders = [...stakeholders, { id: generateID(), name: "", email: "", role: "operator" }];
    }

    const defaultSpecs = [
        { id: "footprint", label: "Footprint / Dimensions", placeholder: "e.g., 2.5m x 1.8m" },
        { id: "throughput", label: "Throughput", placeholder: "e.g., 100 WPH" },
        { id: "accuracy", label: "Accuracy", placeholder: "e.g., ±0.5 µm" },
        { id: "power", label: "Power Requirements", placeholder: "e.g., 208V 3-phase" },
        { id: "weight", label: "Weight", placeholder: "e.g., 1500 kg" }
    ];

    // Hydrate specs
    let activeSpecs: string[] = $state(
        snapshot?.specs?.map((s: any) => defaultSpecs.find(d => d.label === s.title)?.id).filter(Boolean) || []
    );
    let specValues: Record<string, string> = $state(
        snapshot?.specs?.reduce((acc: any, s: any) => {
            const specId = defaultSpecs.find(d => d.label === s.title)?.id;
            if (specId) acc[specId] = s.value;
            return acc;
        }, {}) || {}
    );
    
    type Config = { value: string, title: string, placeholder: string };
    let newSpecTitle = $state("");
    let newSpecUnit = $state("");
    let customSpecs: Config[] = $state(
        snapshot?.specs?.filter((s: any) => !defaultSpecs.some(d => d.label === s.title)).map((s: any) => ({
            title: s.title,
            value: s.value,
            placeholder: s.value
        })) || []
    );

    function addNewSpecification() {
        if (!newSpecTitle || !newSpecUnit) return;
        customSpecs = [...customSpecs, { value: newSpecUnit, title: newSpecTitle, placeholder: newSpecUnit }];
        newSpecTitle = "";
        newSpecUnit = "";
    }

    const costItems: { key: string; label: string; icon: Component; placeholder: string }[] = [
        { key: "purchase", label: "Purchase Price", icon: DollarSign, placeholder: "280,000" },
        { key: "freight", label: "Shipping & Freight", icon: Truck, placeholder: "10,000" },
        { key: "install_services", label: "Vendor Installation", icon: Replace, placeholder: "5,000" },
        { key: "fit_up", label: "Facility Fit-Up", icon: HardHat, placeholder: "15,000" },
        { key: "training", label: "Training", icon: GraduationCap, placeholder: "2,500" },
        { key: "spares", label: "Spare Parts", icon: Package, placeholder: "3,000" },
        { key: "service_contract", label: "Service Contract", icon: Handshake, placeholder: "7,500" },
        { key: "additional", label: "Additional Costs", icon: Ellipsis, placeholder: "0" },
    ];
    const optionalCosts = costItems.filter((c) => c.key !== "purchase");

    // Hydrate budget
    let receipt: Record<string, number> = $state(snapshot?.receipt || { "purchase": 0 });
    let costsCategories: string[] = $state(Object.keys(receipt).filter(k => k !== 'purchase'));

    let estimate: number = $derived(
        Object.entries(receipt)
        .flatMap(([key, value]) => (costsCategories.includes(key) || key === "purchase") ? [value ?? 0] : [])
        .reduce((a, b) => a + b, 0)
    );

    // Hydrate deadlines
    let due = $state(snapshot?.due_date || get3MonthsFromNow());
    let consequence = $state(snapshot?.consequence_if_late || "");
    let firmness = $state(snapshot?.firmness || "");
    let force = $state(snapshot?.force || "");
    
    let dragging = $state(false);
    const fileSize = (n: number) => (n > 1_048_576 ? `${(n / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
    const fileKind = (f: File) => (f.name.split(".").pop() ?? "file").toUpperCase();
    let files: File[] = $state([]);
    
    function addFiles(list: FileList | null) {
        if (!list) return;
        const known = new Set(files.map((f) => `${f.name}:${f.size}`));
        files = [...files, ...Array.from(list).filter((f) => !known.has(`${f.name}:${f.size}`))];
    }

    let touched = $state({ location: false, purpose: false, gap: false, personnel: false, purchase: false });
    let submitted = $state(false);

    // Read-only lock if terminal decision reached
    let isDecided = $derived(snapshot?.outcome === 'approved' || snapshot?.outcome === 'rejected');

    let errors = $derived({
        location: (touched.location || submitted) && !location ? "A location must be selected." : null,
        purpose: (touched.purpose || submitted) && purpose.trim() === "" ? "Equipment name / purpose is required." : null,
        gap: (touched.gap || submitted) && gap.trim() === "" ? "Please explain the current gap this solves." : null,
        personnel: (touched.personnel || submitted) && stakeholders.filter(s => s.name.trim() !== "").length === 0 ? "At least one named personnel is required." : null,
        purchase: (touched.purchase || submitted) && (!receipt.purchase || receipt.purchase <= 0) ? "An estimated purchase price is required." : null
    });

    async function submitProposal() {
        if (isDecided) return;
        
        submitted = true;
        if (Object.values(errors).some(err => err !== null)) {
            return; 
        }
        
        // 1. Freeze current state into an immutable snapshot payload (Draft N+1)
        const newSnapshotId = generateID();
        const capture = {
            id: newSnapshotId,
            version_number: (snapshot.version_number || 0) + 1, // Increment Version
            request_id: request.id,
            request_number: request.request_number, // Passed along for UI rendering convenience
            purpose,
            location,
            need_type: needType,
            details,
            gap,
            programs,
            personnel: stakeholders,
            receipt,
            totalEstimate: estimate,
            due_date: due,
            firmness,
            force,
            consequence_if_late: consequence,
            specs: [
                ...defaultSpecs.filter(s => activeSpecs.includes(s.id)).map(s => ({ title: s.label, value: specValues[s.id] })),
                ...customSpecs
            ]
        };

        // 2. Commit to database
        database.purchase_snapshots[newSnapshotId] = capture;
        database.purchase_requests[request.id].latest_snapshot = newSnapshotId;
        
        // 4. Update the local layout state so Leadership tab renders the newly submitted draft
        snapshot = capture;
        tab = 'leadership';
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
                </dl>
            </div>
        </div>
    </aside>

    <article class='md:pt-28 pb-20'>
        
        <!-- Location -->
        <Field.Set>
            <Field.Legend class='font-medium text-lg mb-1'>Location</Field.Legend>
            <Field.Description>Where will this equipment be used?</Field.Description>
            
            <RadioGroup.Root bind:value={location} disabled={isDecided} onfocusout={() => touched.location = true} class='grid grid-cols-2 gap-4 mt-4'>
                {#each locations as { value, label, icon: Icon }}
                    <Label
                        for={`loc-${value}`}
                        class={`flex flex-col gap-2 items-start border p-4 bg-accent opacity-50 font-medium transition-all
                        data-[selected=true]:bg-white data-[selected=true]:shadow-md data-[selected=true]:text-slate-700 data-[selected=true]:opacity-100
                        ${errors.location ? 'border-destructive' : ''}
                        ${isDecided ? 'pointer-events-none' : 'cursor-pointer hover:opacity-100'}`}
                        data-selected={ value === location }>
                        <RadioGroup.Item id={`loc-${value}`} class='sr-only' {value} disabled={isDecided} />
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
                disabled={isDecided}
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
            <RadioGroup.Root bind:value={needType} disabled={isDecided} class="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
                    disabled={isDecided}
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
                    disabled={isDecided}
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
            
            <ToggleGroup.Root type="multiple" disabled={isDecided} variant="outline" size="sm" spacing={2} bind:value={programs} class="w-full flex-col items-start gap-4 mt-4">
                {#each programGroups as group (group.label)}
                    <div class="flex flex-wrap items-center gap-2">
                        <span class="w-28 text-sm text-muted-foreground">{group.label}</span>
                        {#each group.items as p (p)}
                            <ToggleGroup.Item value={p} class={chip} disabled={isDecided}>{p}</ToggleGroup.Item>
                        {/each}
                    </div>
                {/each}
            </ToggleGroup.Root>
            <div class="mt-4 w-full sm:w-1/2">
                <Label for="customProgram" class="sr-only">Add custom program</Label>
                <Input id="customProgram" bind:value={customProgram} disabled={isDecided} onkeydown={addCustomProgram} placeholder="Type program and hit Enter to add" />
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
                        <Input bind:value={s.name} disabled={isDecided} autocomplete="off" aria-label="Name" placeholder="Sugento Huandra" class={errors.personnel ? 'border-destructive' : ''} />
                        <Input bind:value={s.email} disabled={isDecided} type="email" autocomplete="off" aria-label="Email" placeholder="sugento_huandra@txie.org" />
                        <Select.Root type="single" bind:value={s.role} disabled={isDecided}>
                            <Select.Trigger class="w-full" aria-label="Role">{roleLabel(s.role)}</Select.Trigger>
                            <Select.Content class='rounded-none'>
                                {#each roles as r (r.value)}<Select.Item value={r.value} label={r.label} />{/each}
                            </Select.Content>
                        </Select.Root>
                        <Button size="icon" variant="ghost" disabled={isDecided} aria-label="Remove person" onclick={() => (stakeholders = stakeholders.filter((x) => x.id !== s.id))}>
                            <Trash class="size-4" />
                        </Button>
                    </div>
                {/each}
            </div>
            
            <Button size="sm" variant="outline" disabled={isDecided} class="w-max gap-2 mt-2 mb-2" onclick={addPerson}><UserRoundPlus class="size-4" /> Add person</Button>
            {#if errors.personnel}
                <Field.Error>{errors.personnel}</Field.Error>
            {/if}
        </Field.Set>
        {@render Divider()}

        <!-- Budget -->
        <Field.Set>
            <Field.Legend class='font-medium text-lg mb-1'>Budget</Field.Legend>
            <Field.Description>Provide estimates on what it will cost to acquire and install this equipment. Ballpark estimates are fine, real quotes will be used after approval.</Field.Description>
            
            <ToggleGroup.Root class='flex flex-wrap' type="multiple" disabled={isDecided} variant="outline" size="sm" spacing={2} bind:value={costsCategories}>
                {#each optionalCosts as c (c.key)}
                    <ToggleGroup.Item value={c.key} class={chip} disabled={isDecided}>{c.label}</ToggleGroup.Item>
                {/each}
            </ToggleGroup.Root>

            <div class='grid grid-cols-[auto_1fr_2fr] items-end gap-x-3 gap-y-2' onfocusout={() => touched.purchase = true}>
                {#each costItems.filter((c) => c.key === "purchase" || costsCategories.includes(c.key)) as c (c.key)}
                    <c.icon class='size-5 text-muted-foreground' />
                    <Label class='pb-1'>{c.label}</Label>
                    <Currency bind:value={receipt[c.key]} disabled={isDecided} placeholder={c.placeholder} variant='underline' />

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
            
            <ToggleGroup.Root class='flex flex-wrap' type="multiple" disabled={isDecided} variant="outline" size="sm" spacing={2} bind:value={activeSpecs}>
                {#each defaultSpecs as spec}
                    <ToggleGroup.Item value={spec.id} class={chip} disabled={isDecided}>{spec.label}</ToggleGroup.Item>
                {/each}
            </ToggleGroup.Root>

            <div class='grid grid-cols-[1fr_2fr_auto] items-center gap-x-8 gap-y-1 mt-4' transition:slide>
                {#each defaultSpecs.filter(s => activeSpecs.includes(s.id)) as spec}
                    <strong class="text-sm">{spec.label}</strong>
                    <Input variant='underline' bind:value={specValues[spec.id]} disabled={isDecided} placeholder={spec.placeholder} class='h-8' />
                    <div class="size-8"></div>
                {/each}
                
                {#each customSpecs as spec, i}
                    <strong class="text-sm">{spec.title}</strong>
                    <Input variant='underline' bind:value={customSpecs[i].value} disabled={isDecided} placeholder={spec.placeholder} class='h-8' />
                    <Button class='size-8' variant='ghost' disabled={isDecided} aria-label="Remove spec" onclick={() => customSpecs = customSpecs.filter((_, idx) => idx !== i)}><Trash /></Button>
                {/each}
                
                <Input variant='underline' bind:value={newSpecTitle} disabled={isDecided} class='px-0 shadow-transparent text-sm font-medium' placeholder='Add custom spec...' />
                <Input variant='underline' bind:value={newSpecUnit} disabled={isDecided} placeholder='Value or unit' />
                <Button class='size-8' variant={(!newSpecTitle || !newSpecUnit) ? 'ghost' : 'default'} disabled={isDecided || !newSpecTitle || !newSpecUnit} onclick={addNewSpecification}><Plus /></Button>
            </div>
        </Field.Set>
        {@render Divider()}

        <!-- Target Operational Date -->
        <Field.Set>
            <Field.Legend class='font-medium text-lg mb-1'>Target Operational Date</Field.Legend>
            <Field.Description>When do you need this tool installed & operational by? Approximate date is fine.</Field.Description>
            
            <Field.Field >
                <Field.Label for='due'>Installed & operational by</Field.Label>
                <DatePicker bind:inputValue={due} disabled={isDecided} />
            </Field.Field>

            <Field.Field>
                <Field.Label for="consequence">What happens if it's late?</Field.Label>
                <Input id="consequence" bind:value={consequence} disabled={isDecided} maxlength={140} placeholder="We miss the July milestones for the new product line." />
            </Field.Field>
            
            <div class='grid grid-cols-1 lg:grid-cols-2 gap-x-2 gap-y-2'>
                <Label>How firm is that date?</Label>

                <ToggleGroup.Root type="single" disabled={isDecided} variant="outline" size="sm" spacing={2} bind:value={firmness} class="justify-start">
                    <ToggleGroup.Item value="hard" class={chip} disabled={isDecided}>Hard deadline</ToggleGroup.Item>
                    <ToggleGroup.Item value="target" class={chip} disabled={isDecided}>Target</ToggleGroup.Item>
                    <ToggleGroup.Item value="flexible" class={chip} disabled={isDecided}>Flexible</ToggleGroup.Item>
                </ToggleGroup.Root>

                <Label>Is something forcing the timeline?</Label>
                <ToggleGroup.Root type="single" disabled={isDecided} variant="outline" size="sm" spacing={2} bind:value={force} class="justify-start">
                    <ToggleGroup.Item value="standard" class={chip} disabled={isDecided}>No</ToggleGroup.Item>
                    <ToggleGroup.Item value="expedited" class={chip} disabled={isDecided}>Time-limited offer</ToggleGroup.Item>
                    <ToggleGroup.Item value="emergency" class={chip} disabled={isDecided}>A tool is down</ToggleGroup.Item>
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
                isDecided ? "opacity-50 pointer-events-none" : "cursor-pointer hover:bg-accent/50 has-focus-visible:ring-2 has-focus-visible:ring-ring", 
                dragging && "bg-accent"]}
                ondragover={(e) => { if(isDecided) return; e.preventDefault(); dragging = true; }}
                ondragleave={() => { if(isDecided) return; dragging = false; }}
                ondrop={(e) => { if(isDecided) return; e.preventDefault(); dragging = false; addFiles(e.dataTransfer?.files ?? null); }}>
                <Upload class="size-5 stroke-[1.5]" />
                <span class="font-medium">Drop files here</span>
                <span class="text-muted-foreground">or click to browse</span>
                <input type="file" multiple class="sr-only" disabled={isDecided} onchange={(e) => { addFiles(e.currentTarget.files); e.currentTarget.value = ""; }} />
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
                                <Attachment.Action aria-label="Remove {f.name}" disabled={isDecided} onclick={() => (files = files.filter((_, j) => j !== i))}><X /></Attachment.Action>
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
            onclick={submitProposal} 
            variant={snapshot?.outcome === 'rejected' ? 'destructive' : 'default'} 
            class='ml-auto flex items-center gap-3' 
            disabled={isDecided}
        >
            {#if snapshot?.outcome === 'approved'}
                Proposal Approved <BadgeCheck class='stroke-[1.5]' />
            {:else if snapshot?.outcome === 'rejected'}
                Proposal Rejected <X class='stroke-[1.5]' />
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
        ${isDecided ? 'pointer-events-none' : 'cursor-pointer hover:opacity-100'}`
    }>
        <Icon class='size-5 row-span-2' />
        <strong class="mt-1 font-medium">{ label }</strong>
        <p class="text-sm font-normal text-muted-foreground">{ hint }</p>
        <RadioGroup.Item id={`need-${value}`} class="sr-only" {value} disabled={isDecided} />
    </Label>
{/snippet}

{#snippet Count(value: string, max: number)}
    <InputGroup.Addon align="block-end">
        <InputGroup.Text class="ms-auto text-xs tabular-nums">{max - value.length} left</InputGroup.Text>
    </InputGroup.Addon>
{/snippet}