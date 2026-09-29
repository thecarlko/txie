<script lang="ts">
    import * as Tabs from "$lib/components/tabs";
    import * as Kbd from "$lib/components/kbd";
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
    import { ArrowRight, TestTubeDiagonal, Factory, UserRoundPlus, Trash, Gauge, Hourglass, Replace, RotateCcw, Sparkles, Upload, FileText, X, Plus, Truck, DollarSign, Ellipsis, GraduationCap, Handshake, HardHat, Package } from "@lucide/svelte";
    import Currency from "$lib/components/currency/currency.svelte";
    import Toggle from "$lib/components/toggle/toggle.svelte";
    import { formatCurrency } from "$lib/hooks/finance";
    

    let name = $state("");
    let details = $state("");


    let location : "mer" | "mr2" | "" = $state("");
    let locations = [
        { value: "mer", label: "Microelectronics Research Center", icon: TestTubeDiagonal },
        { value: "mr2", label: "Montopolis Fabrication Bldg.", icon: Factory }
    ];


    // Purpose & Need
    const needTypes = [
        { value: "new_capability", label: "New capability", hint: "Something we can't do today", icon: Sparkles },
        { value: "replacement", label: "Replacement", hint: "Swap out an existing tool", icon: Replace },
        { value: "capacity", label: "More capacity", hint: "Demand is outgrowing what we have", icon: Gauge },
        { value: "end_of_life", label: "End of life", hint: "Vendor support is ending", icon: Hourglass },
        { value: "recurring_failure", label: "Keeps failing", hint: "Repeated downtime or repairs", icon: RotateCcw },
    ];
    let needType: string = $state("");
    let gap = $state("");


    // Programs
    let programs: string[] = $state([]);
    const programGroups = [
        { label: "Process Module", items: ["PM6.2", "PM6.3", "PM6.4"] },
        { label: "Test Vehicle", items: ["TV1", "TV2", "TV3"] },
        { label: "Other", items: ["LAX"] },
    ];


    /** Personel */
    type Person = { id: string; name: string; email: string; role: string };
    const roles = [
        { value: "equipment_owner", label: "Equipment owner" },
        { value: "operator", label: "Operator" },
        { value: "backup_operator", label: "Backup operator" },
        { value: "maintenance", label: "Maintenance" },
    ];


    let stakeholders: Person[] = $state([{ id: generateID(), name: "", email: "", role: "equipment_owner" }]);
    const roleLabel = (v: string) => roles.find((r) => r.value === v)?.label ?? "Choose a role";

    function addPerson() {
        stakeholders = [...stakeholders, { id: generateID(), name: "", email: "", role: "operator" }];
    }


    /** Capabilities */
    type config = { value: string, title: string, placeholder: string };
    let newSpecTitle = $state("");
    let newSpecUnit = $state("");
    let specifications: config[] = $state([
        { value: "", title: "Length", placeholder: "1.2 M" },
        { value: "", title: "Width", placeholder: "2.0 M" },
        { value: "", title: "Throughput", placeholder: "100 wafers/hour" },
        { value: "", title: "Accuracy", placeholder: "±0.5 um" },
    ]);
    async function addNewSpecification() {
        if (!newSpecTitle || !newSpecUnit) return;
        specifications = [...specifications, { value: newSpecUnit, title: newSpecTitle, placeholder: newSpecUnit }];
        newSpecTitle = "";
        newSpecUnit = "";
    }


    /** Budget */
    let costConfidence: "guess" | "quote" | "firm" = $state("quote");
    let purchase = $state<number | undefined>(undefined);
    let costsCategories : string[] = $state([]);
    let receipt : { [key: string]: number } = $state({
        "purchase": 0
    });

    // let estimate = $derived(() =>{
    //     let total = 0;
    //     for (const [key, value] of Object.entries(receipt)) {
    //         if (costsCategories.includes(key) || key === "purchase") {
    //             total += value ?? 0;
    //         }
    //     }
    //     return total;
    // });
    let estimate: number = $derived(
        Object.entries(receipt)
        .flatMap(([key, value]) => (costsCategories.includes(key) || key === "purchase") ? [value ?? 0] : [])
        .reduce((a, b) => a + b, 0)
    );

    /** Deadlines */
    let due = $state("In 3 months");
    let consequence = $state("");
    let firmness = $state("");
    let force = $state("");
    
    /** Attachments */
    let dragging = $state(false);
    const fileSize = (n: number) => (n > 1_048_576 ? `${(n / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
    const fileKind = (f: File) => (f.name.split(".").pop() ?? "file").toUpperCase();
    let files: File[] = $state([]);
    function addFiles(list: FileList | null) {
        if (!list) return;
        const known = new Set(files.map((f) => `${f.name}:${f.size}`));
        files = [...files, ...Array.from(list).filter((f) => !known.has(`${f.name}:${f.size}`))];
    }



    /** Submit */
    async function submitProposal() {

    }

    const chip = "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary";
</script>

<Tabs.Content value="proposal" class='gap-x-8 grid grid-cols-1 md:grid-cols-2 px-[5vw] w-full mx-auto max-w-8xl'>
    <aside>
        <div class='grid grid-rows-[auto_1fr_auto] md:sticky top-0 py-20 md:pt-28 h-screen pr-16'>
            <div>
                <h1 class='text-2xl font-medium'>01 - Proposal</h1>

            </div>
            <br>
            
            <div class=''>
                <!-- <img src='/brand/icon.svg' class='size-10' alt='TxIE logo' /> -->
                <dl class="hidden grid-cols-2 gap-y-2 border-t pt-4 text-sm md:grid">
                    <dt class="text-muted-foreground">Location</dt>
                    <dd class="text-right font-medium uppercase">{ locations.find((l) => l.value === location)?.label ?? "Not set" }</dd>
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
        <!-- Purpose -->
        <h3 class='font-medium text-lg mb-1'>Purpose</h3>
        <p class='text-muted-foreground'>What is this equipment for? Does it enable any new technology or process that isn't currently available?</p>
        <br>
        

        <Label for="name" class='mb-3'>Equipment name / purpose</Label>
        <Input bind:value={name} id='purpose' type='text' placeholder='Wafer Based Plasma Dicer' />
        <br>
        <br>


        <Field.Set>
        <Field.Legend variant="label">What kind of need is it?</Field.Legend>
        <RadioGroup.Root bind:value={needType} class="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {#each needTypes as n (n.value)}
                {@render Choice(n.value, needType, n.label, n.hint, n.icon)}
            {/each}
        </RadioGroup.Root>
        <!-- {@render Err("needType")} -->
        </Field.Set>
        <br>


        <Field.Field data-invalid={ false }>
        <Field.Label for="details">What will it do, and why do we need it?</Field.Label>
        <InputGroup.Root>
            <InputGroup.Textarea
                id="details"
                bind:value={details}
                maxlength={300}
                class="min-h-20 resize-none"
                placeholder={"Supports C4 bumping when pitch is 200 µm or more.\nSeveral customers are asking for 4 to 16 mil spheres, SnPb and SnAg."} />
            {@render Count(details, 300)}
        </InputGroup.Root>
        {@render Err("details")}
        </Field.Field>
        <br>

        <Field.Field data-invalid={ false }>
            <Field.Label for="gap">What can't you do today that this fixes?</Field.Label>
            <InputGroup.Root>
                <InputGroup.Textarea
                    id="gap"
                    bind:value={gap}
                    maxlength={200}
                    class="min-h-20 resize-none"
                    placeholder="Bumping is manual, slow, and error-prone. This automates it and raises throughput." />
                {@render Count(gap, 200)}
            </InputGroup.Root>
            {@render Err("gap")}
        </Field.Field>


        <div class='flex items-center justify-end py-2 text-muted-foreground gap-2'>
            <Kbd.Group>
                <Kbd.Root>Shift</Kbd.Root>
                <span>+</span>
                <Kbd.Root>Enter</Kbd.Root>
            </Kbd.Group>
            <small>to form a new line</small>
        </div>
        {@render Divider()}


        <!-- Location -->
        <h3 class='font-medium text-lg mb-1'>Location</h3>
        <p class='text-muted-foreground'>What building will this equipment be located in?</p>
        <RadioGroup.Root bind:value={ location } class='grid grid-cols-2 gap-4 mt-4'>
            {#each locations as { value, label, icon: Icon }}
                <Label
                    class='cursor-pointer flex flex-col gap-2 items-start border p-4 bg-accent opacity-50 font-medium transition-all
                    data-[selected=true]:bg-white data-[selected=true]:shadow-md data-[selected=true]:text-slate-700 data-[selected=true]:opacity-100'
                    data-selected={ value == location }>

                    <RadioGroup.Item class='hidden' value={ value }/>
                    <Icon class='size-6 stroke-1' />
                    <strong class='mt-2'>{ label }</strong>
                    <p class='font-normal uppercase'>{ value }</p>
                </Label>
            {/each}
        </RadioGroup.Root>
        <br>
        <br>

        <Field.Set>
            <Field.Legend variant="label">Programs it supports</Field.Legend>
            <Field.Description>Pick every program that will use it.</Field.Description>
            <ToggleGroup.Root type="multiple" variant="outline" size="sm" spacing={2} bind:value={programs} class="w-full flex-col items-start gap-4">
                {#each programGroups as group (group.label)}
                    <div class="flex flex-wrap items-center gap-2">
                        <span class="w-28 text-sm text-muted-foreground">{group.label}</span>
                        {#each group.items as p (p)}
                            <ToggleGroup.Item value={p} class={ chip }>{p}</ToggleGroup.Item>
                        {/each}
                    </div>
                {/each}
            </ToggleGroup.Root>
            {@render Err("programs")}

        </Field.Set>
        {@render Divider()}


        <!-- Personnel -->
        <h3 class='font-medium text-lg mb-1'>Personnel</h3>
        <p class='text-muted-foreground'>Who will be responsible for operating and maintaining this equipment?</p>
        <br>

        <Field.Set>
        <Field.Legend variant="label">Who will own, run, and maintain it?</Field.Legend>
        <div class="space-y-2">
            {#each stakeholders as s (s.id)}
                <div class="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[1fr_1fr_11rem_auto]" transition:slide>
                    <Input bind:value={s.name} autocomplete="off" aria-label="Name" placeholder="Sugento Huandra" />
                    <Input bind:value={s.email} type="email" autocomplete="off" aria-label="Email" placeholder="sugento_huandra@txie.org" />
                    <Select.Root type="single" bind:value={s.role}>
                        <Select.Trigger class="w-full" aria-label="Role">{roleLabel(s.role)}</Select.Trigger>
                        <Select.Content class='rounded-none'>
                            {#each roles as r (r.value)}<Select.Item value={r.value} label={r.label} />{/each}
                        </Select.Content>
                    </Select.Root>
                    <Button size="icon" variant="ghost" aria-label="Remove person" onclick={() => (stakeholders = stakeholders.filter((x) => x.id !== s.id))}>
                        <Trash class="size-4" />
                    </Button>
                </div>
            {/each}
        </div>
        <Button size="sm" variant="outline" class="w-max gap-2" onclick={addPerson}><UserRoundPlus class="size-4" /> Add person</Button>
        </Field.Set>
        {@render Divider()}


        <!-- Budget -->
        <h3 class='font-medium text-lg mb-1'>Budget</h3>
        <p class='text-muted-foreground'>Provide estimates on what it will cost to acquire and install this equipment. Ballpark estimates are fine, real quotes will be used after approval.{ costsCategories }</p>
        <br>

        <ToggleGroup.Root class='flex flex-wrap' type="multiple" variant="outline" size="sm" spacing={2} bind:value={costsCategories}>
            <ToggleGroup.Item value="shipping" class={chip}>Shipping & Freight</ToggleGroup.Item>
            <ToggleGroup.Item value="vendor" class={chip}>Vendor Installation</ToggleGroup.Item>
            <ToggleGroup.Item value="facility" class={chip}>Facility Fit-Up</ToggleGroup.Item>
            <ToggleGroup.Item value="training" class={chip}>Training</ToggleGroup.Item>
            <ToggleGroup.Item value="spares" class={chip}>Spare Parts</ToggleGroup.Item>
            <ToggleGroup.Item value="service" class={chip}>Service Contract</ToggleGroup.Item>
            <ToggleGroup.Item value="other" class={chip}>Additional Costs</ToggleGroup.Item>
        </ToggleGroup.Root>
        <br>

        <div class='grid grid-cols-[auto_1fr_2fr] items-end gap-x-3 gap-y-2'>
            <DollarSign class='size-5' />
            <Label class='pb-1'>Purchase Price</Label>
            <Currency bind:value={receipt.purchase} placeholder="280,000" variant='underline' />

            {#if costsCategories.includes('shipping')}
            <Truck class='size-5' />
            <Label class='pb-1'>Shipping & Freight</Label>
            <Currency bind:value={receipt["shipping"]} placeholder="10,000" variant='underline' />
            {/if}

            {#if costsCategories.includes('vendor')}
            <Replace class='size-5' />
            <Label class='pb-1'>Vendor Installation</Label>
            <Currency bind:value={receipt["vendor"]} placeholder="5,000" variant='underline' />
            {/if}

            {#if costsCategories.includes('facility')}
            <HardHat class='size-5' />
            <Label class='pb-1'>Facility Fit-Up</Label>
            <Currency bind:value={receipt["facility"]} placeholder="15,000" variant='underline' />
            {/if}

            {#if costsCategories.includes('training')}
            <GraduationCap class='size-5' />
            <Label class='pb-1'>Training</Label>
            <Currency bind:value={receipt["training"]} placeholder="2,500" variant='underline' />
            {/if}


            {#if costsCategories.includes('spares')}
            <Package class='size-5' />
            <Label class='pb-1'>Spare Parts</Label>
            <Currency bind:value={receipt["spares"]} placeholder="3,000" variant='underline' />
            {/if}

            {#if costsCategories.includes('service')}
            <Handshake class='size-5' />
            <Label class='pb-1'>Service Contract</Label>
            <Currency bind:value={receipt["service"]} placeholder="7,500" variant='underline' />
            {/if}

            {#if costsCategories.includes('other')}
            <Ellipsis class='size-5' />
            <Label class='pb-1'>Additional Costs</Label>
            <Currency bind:value={receipt["other"]} placeholder="0" variant='underline' />
            {/if}
        </div>
        <br>
        <br>
        <div class='grid grid-cols-[1fr_auto] gap-2 items-end mt-2'>
            <p class='text-end '>Total estimated cost:</p>
            <strong class='text-xl font-medium'>{ formatCurrency(estimate) }</strong>
        </div>

        {@render Divider()}


        <!-- Target Specifications & Capabilities -->
        <h3 class='font-medium text-lg mb-1'>Target Specifications & Capabilities</h3>
        <p class='text-muted-foreground'>What specifications and capabilities will this equipment need to meet? (e.g. length x width x height; throughput; accuracy, etc.) select all that apply.</p>
        <br>


        <div class='grid grid-cols-[1fr_2fr_auto] items-center gap-x-2 gap-y-1'>
            {#each specifications as spec, i }
            {@render Specification(spec, i)}
            {/each}
            <Input bind:value={newSpecTitle} class='border-0 px-0 shadow-transparent text-xl font-medium' placeholder='Add new spec...' />
            <Input bind:value={newSpecUnit} placeholder='±0.5 um' />
            <Button class='size-8' variant={ (!newSpecTitle || !newSpecUnit) ? 'ghost' : 'default' } onclick={ addNewSpecification } disabled={ !newSpecTitle || !newSpecUnit }><Plus  /></Button>
        </div>
        {@render Divider()}


        <!-- Target Operational Date -->
        <h3 class='font-medium text-lg mb-1'>Target Operational Date</h3>
        <p class='text-muted-foreground'>When do you need this tool installed & operational by? Approximate date is fine.</p>
        <br>

        <Label for='due' class='mb-3'>Installed & operational by</Label>
        <DatePicker bind:inputValue={ due } />
        <br>

        <Field.Field>
            <Field.Label for="consequence">What happens if it's late?</Field.Label>
            <Input id="consequence" bind:value={consequence} maxlength={140} placeholder="We miss the July milestones for the new product line." />
        </Field.Field>
        <br>
        <br>
        
        <div class='grid grid-cols-2 gap-x-2 gap-y-2'>
            <Label>How firm is that date?</Label>
            <Label>Is something forcing the timeline?</Label>

            <ToggleGroup.Root type="single" variant="outline" size="sm" spacing={2} bind:value={firmness}>
                <ToggleGroup.Item value="hard" class={chip}>Hard deadline</ToggleGroup.Item>
                <ToggleGroup.Item value="target" class={chip}>Target</ToggleGroup.Item>
                <ToggleGroup.Item value="flexible" class={chip}>Flexible</ToggleGroup.Item>
            </ToggleGroup.Root>

            <ToggleGroup.Root type="single" variant="outline" size="sm" spacing={2} bind:value={force}>
                <ToggleGroup.Item value="standard" class={chip}>No</ToggleGroup.Item>
                <ToggleGroup.Item value="expedited" class={chip}>Time-limited offer</ToggleGroup.Item>
                <ToggleGroup.Item value="emergency" class={chip}>A tool is down</ToggleGroup.Item>
            </ToggleGroup.Root> 
        </div>
        {@render Divider()}









        <!-- Attachments -->
        <Field.Set>
            <Field.Legend variant="label">Attachments</Field.Legend>
            <Field.Description>Add any additional files (e.g. quotes, datasheets, or emails)</Field.Description>
            <label
                class={["flex cursor-pointer flex-col items-center gap-1.5 border border-dashed p-6 text-center text-sm transition-colors hover:bg-accent/50 has-focus-visible:ring-2 has-focus-visible:ring-ring", dragging && "bg-accent"]}
                ondragover={(e) => { e.preventDefault(); dragging = true; }}
                ondragleave={() => (dragging = false)}
                ondrop={(e) => { e.preventDefault(); dragging = false; addFiles(e.dataTransfer?.files ?? null); }}>
                <Upload class="size-5 stroke-[1.5]" />
                <span class="font-medium">Drop files here</span>
                <span class="text-muted-foreground">or click to browse</span>
                <input type="file" multiple class="sr-only" onchange={(e) => { addFiles(e.currentTarget.files); e.currentTarget.value = ""; }} />
            </label>
            {#if files.length}
                <div class="flex flex-col gap-2">
                    {#each files as f, i (f.name + f.size + f.lastModified)}
                        <Attachment.Root state="idle" size="sm" class="w-full">
                            <Attachment.Media><FileText /></Attachment.Media>
                            <Attachment.Content>
                                <Attachment.Title>{f.name}</Attachment.Title>
                                <Attachment.Description>{fileKind(f)} {fileSize(f.size)}</Attachment.Description>
                            </Attachment.Content>
                            <Attachment.Actions>
                                <Attachment.Action aria-label="Remove {f.name}" onclick={() => (files = files.filter((_, j) => j !== i))}><X /></Attachment.Action>
                            </Attachment.Actions>
                        </Attachment.Root>
                    {/each}
                </div>
            {/if}
        </Field.Set>
        <br>
        <br>
        <br>

        <Button onclick={() => submitProposal()} variant='default' class='ml-auto flex items-center gap-3'>Forward Proposal to FAB Leadership <ArrowRight class='stroke-[1.5]' /></Button>

    </article>
</Tabs.Content>



{#snippet Specification(spec: config, index: number)}
{@const { title, placeholder } = spec }
<strong>{spec.title}</strong>
<Input bind:value={ specifications[index].value } placeholder={ placeholder } class='h-8' />
<Button class='size-8' variant='ghost' onclick={ () => specifications = specifications.filter((_, i) => i !== index) }><Trash  /></Button>
{/snippet}


{#snippet Divider()}
    <br>
    <hr class='border-[0.5] border-dashed'>
    <br>
{/snippet}

{#snippet Choice(value: string, current: string, label: string, hint: string, Icon: Component)}
    <label data-selected={value === current} class={
        "cursor-pointer flex flex-col items-start gap-1.5 border px-4 py-4 bg-accent/60 opacity-60 hover:opacity-100 transition-all " +
        "has-focus-visible:ring-2 has-focus-visible:ring-ring " +
        "data-[selected=true]:bg-background data-[selected=true]:shadow-md data-[selected=true]:opacity-100 data-[selected=true]:border-foreground/30"
    }>
        <Icon class='size-5 row-span-2' />
        <strong class="mt-1 font-medium">{ label }</strong>
        <p class="text-sm font-normal text-muted-foreground">{ hint }</p>
        <RadioGroup.Item class="hidden" {value} />
    </label>
{/snippet}

{#snippet Err(key: string)}
    <Field.Error></Field.Error>
{/snippet}

{#snippet Count(value: string, max: number)}
    <InputGroup.Addon align="block-end">
        <InputGroup.Text class="ms-auto text-xs tabular-nums">{max - value.length} left</InputGroup.Text>
    </InputGroup.Addon>
{/snippet}
