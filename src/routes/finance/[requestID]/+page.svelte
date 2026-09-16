<script lang='ts'>
    import { toast } from "svelte-sonner";
    import { Button } from "$lib/components/button";
    import { Input } from "$lib/components/input";
    import { Label } from "$lib/components/label";
    import { Microscope, Layers, ScanSquare, ArrowLeft, ArrowRight } from "@lucide/svelte";
    import * as RadioGroup from "$lib/components/radio-group";
    import * as InputGroup from "$lib/components/input-group";
    import { DatePicker } from "$lib/components/date-picker";
    import { type Proposal, type PurchaseRequest } from "$lib/data/procurement.svelte";
    import { generateID } from "$lib/hooks/hash";
    import { page } from "$app/state";
    import { bank } from "$lib/data/bank.svelte";

    let { requestID } = $derived(page.params);

    let project : "process-module" | "test-vehicle" | "process-vehicle" = $state("process-module");
    let projectTypes = [
        { value: "process-module", label: "Process Module", icon: Layers },
        { value: "test-vehicle", label: "Test Vehicle", icon: ScanSquare },
        { value: "process-vehicle", label: "Process Vehicle", icon: Microscope },
    ];

    let name = $state("");
    let email = $state("");
    let purpose = $state("");
    let details = $state("");
    let due = $state("");

    let request: PurchaseRequest | undefined = $derived(bank.purchaseRequests[requestID ?? '']);
    

    async function submitProposal() {
        if (!request) return;
        const proposal: Proposal = {
            id: generateID(), 
            type: project,
            requester: name,
            requesterEmail: email,

            purpose, details, due
        }

        request.proposals.push(proposal);
    }
</script>


{#if !request }
    <br>
    <br>
    <br>
    <h1>Request not found</h1>
{:else}
<section class='relative grid grid-cols-2 px-[5vw]'>
    <nav id='stage' class='fixed top-0 left-0 w-full pt-3 h-20 flex justify-center items-center gap-3 bg-background'>
        <Button size='sm' variant='ghost' class='text-blue-500 font-medium'>Proposal</Button>
        <Button size='sm' variant='ghost'>Committee</Button>
        <Button size='sm' variant='ghost' disabled>Vendors</Button>
        <Button size='sm' variant='ghost' disabled>Procurement</Button>
    </nav>

    <section class='sticky top-40 h-max '>
    <article class='max-w-xl mx-auto w-full'>
        <h1>New Proposal</h1>
    </article>
    </section>
    
    <form onsubmit={ submitProposal } class='max-w-xl pt-40 pb-24'>
        <h3 class='font-medium text-lg mb-1'>Supported Project { request.id }</h3>
        <p class='text-muted-foreground'>What project is this going to be used for?</p>
        <RadioGroup.Root bind:value={ project } class='grid grid-cols-3 gap-4 mt-4'>
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
        <hr class='border-[0.5] border-dashed'>
        <br>


        <h3 class='font-medium text-lg mb-1'>Project Owners</h3>
        <p class='text-muted-foreground'>Who is making the request for a new capability/equipment? Anyone else involved?</p>
        <br>
        <div class='grid grid-cols-2 gap-y-3 gap-x-4'>
            <Label for="name">Your name</Label>
            <Label for="email">Email Address</Label>
    
            <Input bind:value={name} id='name' type='name' placeholder='Sugento Huandra' />
            <Input bind:value={email} id='email' type='email' placeholder='sugento_huandra@txie.org'/> 
        </div>
        <br>
        <hr class='border-[0.5] border-dashed'>
        <br>

    
        <h3 class='font-medium text-lg mb-1'>Proposal Overview</h3>
        <p class='text-muted-foreground'>Provide extra information about the tool. What will it be used for? Why do we need it?</p>
        <br>
        <Label for="purpose" class='mb-3'>Equipment Purpose</Label>
        <Input bind:value={purpose} id='purpose' type='text' placeholder='Wafer Based Plasma Dicing' />
        <br>
        <br>
    
        <Label for="details" class='mb-3'>Details</Label>
        <InputGroup.Root>
            <InputGroup.Textarea
                id='details'
                class='resize-y min-h-40'
                bind:value={details}
                placeholder={ `To support C4 bumping process when pitch is >=200 um.\nMultiple potential customers asking for capability with 4 mil to 16 mil spheres, SnPb and SnAg.\n\nTwo options:\n\t‒ (1) ball drop (w/flux print & rework), est. $2M,\n\t‒ (2) laser jet (lower throughput), est. $800k ...` }/>
        </InputGroup.Root>
        <br>
        
    
        <Label for="details" class='mb-3'>Due By</Label>
        <DatePicker bind:value={due} />
        <br>
        <br>
        <br>
        <Button variant='default' class='ml-auto flex items-center gap-3 pl-4'>Submit to Committee <ArrowRight /></Button>


        <br>
        <br>
    </form>

</section>
{/if}





