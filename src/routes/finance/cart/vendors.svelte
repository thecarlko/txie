

<script lang='ts'>
    import { Label } from "$lib/components/label";
    import { Input } from "$lib/components/input";
    import * as RadioGroup from "$lib/components/radio-group";
    import { Building, Factory, TestTubeDiagonal } from "@lucide/svelte";
    import Currency from '$lib/components/currency/currency.svelte';
    import { formatCurrency } from "$lib/hooks/finance";
    import { Button } from "$lib/components/button";
    import { ArrowRight } from "@lucide/svelte";

    let location : "mer" | "mr2" = $state("mer");
    let locations = [
        { value: "mer", label: "Microelectronics Research Center", icon: TestTubeDiagonal },
        { value: "mr2", label: "Montopolis Fabrication Bldg.", icon: Factory }
    ];

    let vendor = $state("");
    let model = $state("");

    let purchase = $state(0);
    let fitup = $state(0);
    let misc = $state(0);

    let validProposal = $derived(
        location.length > 0 && vendor.length > 0 && model.length > 0 && true
    )
</script>



<section class='grid grid-cols-2'>
    <aside>
        <header class='sticky top-36 pt-2'>
            <strong class='text-xl font-medium'>03 - Vendors</strong>
        </header>
    </aside>

    <form class=''>
        <Label for="location">Location</Label>
        <small class='text-muted-foreground'>What building will this equipment be located in?</small>
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


        <div class='grid grid-cols-2 gap-y-3 gap-x-4'>
            <Label for="vendor">Vendor</Label>
            <Label for="model">Model</Label>
    
            <Input bind:value={vendor} id='vendor' type='text' placeholder='Applied Materials, LAM, Camtek ...' />
            <Input bind:value={model} id='model' type='text' placeholder='PJ9000' />
        </div>
        <br>

        <h4 class='font-medium'>Cost</h4> 
        <p class='text-muted-foreground'>How much is the estimated cost for this tool/service</p>
        <div class='mt-3 grid grid-cols-3 gap-y-3 gap-x-3 items-center'>
            <label for='purpose' class='text-sm font-medium'>Est. Purchase</label>
            <Currency bind:value={ purchase} />
            
            <label for='purpose' class='text-sm font-medium'>Est. Fit-Up & Shipping</label>
            <Currency bind:value={ fitup } />

            <label for='purpose' class='text-sm font-medium'>Est. Miscellaneous & Fees</label>
            <Currency bind:value={ misc } />
        </div>
        <p class='mt-4 text-end text-sm text-muted-foreground'>Total estimated cost: <span class='text-xl text-foreground font-medium'>{ formatCurrency(purchase + fitup + misc) }</span></p>
        <br>
        <br>

        <Button type='submit' disabled={ !validProposal } variant='default' class='ml-auto flex items-center gap-3 pl-4'>Submit to Procurement <ArrowRight class='stroke-[1.5]' /></Button>
        <br>
        <br>
    </form>
</section>
<br>
<br>
<br>
<br>