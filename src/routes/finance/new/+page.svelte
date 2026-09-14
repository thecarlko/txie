

<script lang='ts'>
    import Button from '$lib/components/button/button.svelte';
    import Currency from '$lib/components/currency/currency.svelte';
import * as InputGroup from '$lib/components/input-group';
    import { formatCurrency } from '$lib/hooks/finance';
    import { AtSign, Goal, SearchIcon, UserRound } from '@lucide/svelte';

    let purchase = $state(0);
    let fitup = $state(0);
    let misc = $state(0);
    

    async function submitProposal() {


    }
</script>


<br>
<br>
<br>
<article class='px-[5vw]'>
    <form class='max-w-xl mx-auto'>
        <h2 class='font-medium text-2xl mb-2'>Create a new Procurement Proposal</h2>
        <p class='text-muted-foreground'>Lorem ipsum dolor sit amet consectetur adipisicing elit. Perferendis minima numquam recusandae?</p>
        <br>
        
        <h4 class='font-medium text-'>Primary Contact</h4>        
        <div class='grid grid-cols-2 grid-rows-[max_content,1fr] gap-3'>
            <label for='person' class='text-sm font-medium'>Full Name</label>
            <label for='email' class='text-sm font-medium'>Email</label>

            <InputGroup.Root id='person' class='mb-3'>
                <InputGroup.Input placeholder="Ada Lovelace" />
                <InputGroup.Addon><UserRound /></InputGroup.Addon>
            </InputGroup.Root>
    
            <InputGroup.Root id='email' class='mb-3'>
                <InputGroup.Input placeholder="ada_lovelace@txie.org" />
                <InputGroup.Addon><AtSign /></InputGroup.Addon>
            </InputGroup.Root>
        </div>
        <br>
        <hr class='border-b-[0.5] border-dashed'>
        <br>

        <h4 class='font-medium text-'>Statement of Purpose</h4>     
        <p class='text-muted-foreground'>What is the tool/service to be used for? Provide a short purpose & detailed description of the intended use.</p>   

        <div class='space-y-3 mt-3'>
            <label for='purpose' class='text-sm font-medium'>Purpose</label>
            <InputGroup.Root id='person' class='mb-3'>
                <InputGroup.Input placeholder="Single Wafer Cleans @ MER" />
                <InputGroup.Addon><Goal /></InputGroup.Addon>
            </InputGroup.Root>


            <label for='details' class='text-sm font-medium'>Details</label>
            <InputGroup.Root id='details'>
                <InputGroup.Textarea placeholder={ `Need inline DC parametric testing. Fully enclosed ISO Class 2 clean room. Specs:\n * 100mm x 150mm\n * 200 V with AC-DC conversion` }/>


                <InputGroup.Addon align="block-end"><InputGroup.Text class="text-xs text-muted-foreground"></InputGroup.Text></InputGroup.Addon>
            </InputGroup.Root>
        </div>
        <br>
        <hr class='border-b-[0.5] border-dashed'>
        <br>

        <h4 class='font-medium text-'>Cost</h4>     
        <p class='text-muted-foreground'>How much is the estimated cost for this tool/service</p>
        <div class='mt-3 grid grid-cols-3 gap-y-2 gap-x-3 items-center'>
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

        <Button class='block ml-auto'>Submit</Button>
        <br>
        <br>

    </form>
</article>