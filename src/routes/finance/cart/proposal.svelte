

<script lang='ts'>
    import * as RadioGroup from "$lib/components/radio-group";
    import * as InputGroup from "$lib/components/input-group";
    import * as Kbd from "$lib/components/kbd";
    import { Input } from "$lib/components/input";
    import { Label } from "$lib/components/label";
    import { Button } from "$lib/components/button";
    import { DatePicker } from "$lib/components/date-picker";
    import { Plus, ArrowRight, Layers, ScanSquare, Microscope, TestTubeDiagonal, Factory, UserRoundPlus, Trash } from "@lucide/svelte";
    

    let name = $state("");
    let email = $state("");
    let stakeholders: { name: string; email: string }[] = $state([ ]);

    let purpose = $state("");
    let details = $state("");
    let due = $state("Next Week");
    let specifications = $state("");

    let location : "mer" | "mr2" = $state("mer");
    let locations = [
        { value: "mer", label: "Microelectronics Research Center", icon: TestTubeDiagonal },
        { value: "mr2", label: "Montopolis Fabrication Bldg.", icon: Factory }
    ];


    let projectTypes = [
        { value: "process-module", label: "Process Module", icon: Layers },
        { value: "test-vehicle", label: "Test Vehicle", icon: ScanSquare },
        { value: "process-vehicle", label: "Process Vehicle", icon: Microscope },
    ];


    let project : "process-module" | "test-vehicle" | "process-vehicle" = $state("process-module");
    let validProposal = $derived(
        name.length > 0 && email.length > 0 && purpose.length > 0 && details.length > 0 && due.length > 0
    )

    async function addStakeholder() {
        stakeholders = [...stakeholders, { name: "", email: "" }];
    }

    async function removeStakeholder(index: number) {
        stakeholders = stakeholders.filter((_, i) => i !== index);
    }

    async function submitProposal() {
        
    }
</script>



<section id='proposal' class='grid grid-cols-2'>
    <aside>
        <header class='sticky top-36 pt-2'>
            <strong class='text-xl font-medium'>01 - Proposal</strong>
        </header>
    </aside>

    <div>
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
        <hr class='border-[0.5] border-dashed'>
        <br>


        <div class='grid grid-cols-2 gap-y-3 gap-x-4'>
            <Label for="name">Your name</Label>
            <Label for="email">Email Address</Label>
    
            <Input bind:value={name} id='name' type='name' placeholder='Leonel Aranda' />
            <Input bind:value={email} id='email' type='email' placeholder='leonel_aranda@txie.org'/>

            {#each stakeholders as { name, email }, index}
                <Input bind:value={stakeholders[index].name} id='name' type='name' placeholder='Barbara Groh' />
                <div class='flex items-center gap-2'>
                    <Input bind:value={stakeholders[index].email} id='email' type='email' placeholder='barbara_groh@txie.org' class='flex-1' />
                    <Button size='icon' variant='ghost' class='shrink-0' onclick={() => removeStakeholder(index)} aria-label='Remove stakeholder'>
                        <Trash class='size-4' />
                    </Button>
                </div>
            {/each}

            <Button size='sm' variant='outline' class='col-span-full w-max mx-auto gap-x-2 pr-4' onclick={addStakeholder}><UserRoundPlus class='size-4' /> Add Stakeholder</Button>
        </div>
        <br>
        <hr class='border-[0.5] border-dashed'>
        <br>


        <Label for="purpose" class='mb-3'>Equipment Purpose</Label>
        <Input bind:value={purpose} id='purpose' type='text' placeholder='Wafer Based Plasma Dicing' />
        <br>
        <br>
    
        <label for='project' class='font-medium block'>Details</label>
        <small class='text-muted-foreground'>Which technology & process will this tool enable that isn't currently available?</small>
        <InputGroup.Root class='mt-4'>
            <InputGroup.Textarea
                id='details'
                class='resize-y min-h-40'
                bind:value={details}
                placeholder={ `To support C4 bumping process when pitch is >=200 um.\nMultiple potential customers asking for capability with 4 mil to 16 mil spheres, SnPb and SnAg.\n\nTwo options:\n\t‒ (1) ball drop (w/flux print & rework), est. $2M,\n\t‒ (2) laser jet (lower throughput), est. $800k ...` }/>
        </InputGroup.Root>
        <div class='flex items-center justify-end py-2 text-muted-foreground gap-2'>
            <Kbd.Group>
                <Kbd.Root>Shift</Kbd.Root>
                <span>+</span>
                <Kbd.Root>Enter</Kbd.Root>
            </Kbd.Group>
            <small>to form a new line</small>
        </div>
        <br>
        
    
        <Label for="details">Installed & Operational By:</Label>
        <small class='block my-2 text-muted-foreground'>When do you need this tool installed & operational by? Approximate date is fine.</small>
        <DatePicker bind:inputValue={ due } />
        <br>
        <hr class='border-[0.5] border-dashed'>
        <br>

        <label for='project' class='font-medium block'>Supported Project</label>
        <small class='text-muted-foreground'>What project is this going to be used for?</small>
        <RadioGroup.Root id='project' bind:value={ project } class='grid grid-cols-3 gap-4 mt-4'>
            {#each projectTypes as { value, label, icon: Icon }}
                <Label
                    class='cursor-pointer flex flex-col gap-3 items-start border p-4 bg-accent opacity-50 font-medium transition-all
                    data-[selected=true]:bg-white data-[selected=true]:shadow-md data-[selected=true]:text-slate-700 data-[selected=true]:opacity-100'
                    data-selected={ value == project }>
    
                    <RadioGroup.Item class='hidden' value={ value }/>
                    <Icon class='size-6 stroke-1' />
                    { label }
                </Label>
            {/each}
        </RadioGroup.Root>
        <br>


        <label for='project' class='font-medium block'>Specifications</label>
        <small class='text-muted-foreground'>What are the specifications of this tool? (e.g. length x width x height; throughput; accuracy, etc.)</small>
        <InputGroup.Root class='mt-4'>
            <InputGroup.Textarea
                id='details'
                class='resize-y min-h-32'
                bind:value={specifications}
                placeholder={ `Length: 1.2m\nWidth: 0.8m\nHeight: 1.5m\nThroughput: 100 wafers/hour\nAccuracy: ±0.5 um` }/>
        </InputGroup.Root>
        <div class='flex items-center justify-end py-2 text-muted-foreground gap-2'>
            <Kbd.Group>
                <Kbd.Root>Shift</Kbd.Root>
                <span>+</span>
                <Kbd.Root>Enter</Kbd.Root>
            </Kbd.Group>
            <small>to form a new line</small>
        </div>
        <br>

        <br>
        <Button onclick={() => submitProposal()} disabled={ !validProposal } variant='default' class='ml-auto flex items-center gap-3 pl-4'>Submit to FAB Leadership <ArrowRight class='stroke-2' /></Button>
        <br>
    

    </div>
</section>
<br>
<br>
<br>
<br>

