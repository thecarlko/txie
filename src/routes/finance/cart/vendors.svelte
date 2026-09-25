

<script lang='ts'>
    import { Label } from "$lib/components/label";
    import { Input } from "$lib/components/input";
    import * as RadioGroup from "$lib/components/radio-group";
    import { Building, Factory, TestTubeDiagonal, Plus, FilePlusCorner } from "@lucide/svelte";
    import Currency from '$lib/components/currency/currency.svelte';
    import { formatCurrency } from "$lib/hooks/finance";
    import { Button } from "$lib/components/button";
    import { ArrowRight, Star, Trash } from "@lucide/svelte";
    import * as Carousel from "$lib/components/carousel";
    import * as Tabs from "$lib/components/tabs";
    import { isUndefined } from "@unovis/ts";


    type Vendor = {
        name: string;
        model: string;
        purchase: number | undefined;
        shipping: number | undefined;
        fitup: number | undefined;
        misc: number | undefined;
        recommended: boolean;
    }


    let vendors = $state<Vendor[]>([
        { name: "", model: "", purchase: undefined, shipping: undefined, fitup: undefined, misc: undefined, recommended: false },
    ]);


    function addVendor() {
        vendors.push({ name: "", model: "", purchase: undefined, shipping: undefined, fitup: undefined, misc: undefined, recommended: false });
    }

    function removeVendor(index: number) {
        vendors = vendors.filter((_, i) => i !== index);
    }

    // At least one vendor must have complete information (name, model, and at least one cost field) to submit
    let submitValid = $derived(
        vendors.some(vendor => vendor.name && vendor.model && (vendor.purchase || vendor.shipping || vendor.fitup || vendor.misc))
    )
</script>



<section class='grid grid-cols-2'>
    <aside>
        <header class='sticky top-36 pt-2'>
            <strong class='text-xl font-medium'>03 - Vendors</strong>
        </header>
    </aside>

    <article>
        <Tabs.Root value="0">
            <Tabs.List class='mb-4 bg-transparent gap-2'>
                {#each vendors as vendor, index}
                <Tabs.Trigger value={index.toString()} class='p-3 h-7 data-active:bg-foreground data-active:text-background data-active:hover:text-background'>
                    { vendor.name || `Vendor ${ index + 1 }` }
                    {#if vendor.recommended}<Star class='size-4 stroke-0 fill-[#f59e0b]'/>{/if}
                </Tabs.Trigger>
                {/each}

                {#if vendors.length < 4 }
                <Button size='sm' variant='outline' class='flex col-span-full w-max mx-auto gap-x-1 pr-4' onclick={ addVendor }><Plus class='size-4' /> Add Vendor</Button>
                {/if}
            </Tabs.List>

            
            {#each vendors as vendor, index }
            {@const total = (vendor.purchase ?? 0) + (vendor.shipping ?? 0) + (vendor.fitup ?? 0) + (vendor.misc ?? 0) }
            {@const recc = vendor.recommended }
            <Tabs.Content value={ index.toString() }>
                <div class='grid grid-cols-2 gap-y-3 gap-x-4'>
                <Label for="vendor">Vendor</Label>
                <Label for="model">Model</Label>
        
                <Input bind:value={ vendors[index].name } id='vendor' type='text' placeholder='Applied Materials, LAM, Camtek ...' />
                <Input bind:value={vendors[index].model} id='model' type='text' placeholder='PJ9000' />
                </div>
                <br>
        
                <h4 class='font-medium'>Cost</h4> 
                <p class='text-muted-foreground'>How much is the estimated cost for this tool.</p>
                <div class='mt-3 grid grid-cols-3 gap-y-3 gap-x-3 items-center'>
                    <label for='purpose' class='text-sm font-medium'>Est. Purchase</label>
                    <Currency bind:value={ vendors[index].purchase } />
        
                    <label for='purpose' class='text-sm font-medium'>Est. Shipping</label>
                    <Currency bind:value={ vendors[index].shipping } />
                    
                    <label for='purpose' class='text-sm font-medium'>Est. Fit-Up</label>
                    <Currency bind:value={ vendors[index].fitup } />
        
                    <label for='purpose' class='text-sm font-medium'>Est. Miscellaneous & Fees</label>
                    <Currency bind:value={ vendors[index].misc } />
                </div>
                <br>
                <div class='grid grid-cols-[auto_auto_1fr_auto] gap-2 items-end mt-2'>
                    <Button onclick={ () => vendor.recommended = !recc } size='sm' variant='outline' class='flex items-center gap-2 pr-4'>
                        {#if recc }
                        <Star class='size-4 stroke-0 fill-orange-400' /> Recommend
                        {:else}
                        <Star class='size-4' /> Recommend
                        {/if}
                    </Button>

                    {#if vendors.length > 1 }
                    <Button variant='ghost' size='sm' class='px-3 hover:text-red-500' onclick={ () => removeVendor(index) }><Trash class='size-4' />Delete</Button>
                    {:else}
                    <span></span>
                    {/if}

                    <p class='text-end '>Total estimated cost:</p>
                    <strong class='text-xl font-medium'>{ formatCurrency(total) }</strong>
                </div>
                <br>
                <br>

                <strong class='mb-4 font-medium block'>Attachment</strong>
                <label for='attachment' class='border border-dashed flex flex-col items-center justify-center px-4 py-8 gap-1'>
                    <FilePlusCorner class='size-7 stroke-1' />
                    <br>
                    <strong>Click or drag to upload vendor files (optional)</strong>
                    <span class='text-sm text-muted-foreground'>supported file types: .pdf, .doc, .docx, .xls, .xlsx, .png, .jpg</span>
                    <input type='file' id='attachment' class='hidden' />
                </label>
            </Tabs.Content>
            {/each}
        </Tabs.Root>
        <br>
        <br>

        <Button type='submit' disabled={!submitValid} variant='default' class='ml-auto flex items-center gap-3 pl-4'>Submit Vendors <ArrowRight class='stroke-[1.5]' /></Button>
        <br>
        <br>

    
    </article>
</section>
<br>
<br>
<br>
<br>