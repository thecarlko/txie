

<script lang='ts'>
    import { Label } from "$lib/components/label";
    import { Input } from "$lib/components/input";
    import * as RadioGroup from "$lib/components/radio-group";
    import { Building, Factory, TestTubeDiagonal, Plus, FilePlusCorner, Activity, Cylinder, Droplets, Fan, FlaskConical, Network, Wind, Zap, Biohazard, Globe, HardHat, Recycle } from "@lucide/svelte";
    import Currency from '$lib/components/currency/currency.svelte';
    import { formatCurrency } from "$lib/hooks/finance";
    import { Button } from "$lib/components/button";
    import { ArrowRight, Star, Trash } from "@lucide/svelte";
    import * as Carousel from "$lib/components/carousel";
    import * as Tabs from "$lib/components/tabs";
    import { isUndefined } from "@unovis/ts";
    import * as Field from "$lib/components/field";
    import * as ToggleGroup from "$lib/components/toggle-group";
    import { slide } from "svelte/transition";
    import { Switch } from "$lib/components/switch";



    type Vendor = {
        name: string;
        model: string;
        purchase: number | undefined;
        shipping: number | undefined;
        fitup: number | undefined;
        misc: number | undefined;
        support: number | undefined;
        recommended: boolean;
    }
    let currentVendorIndex = $state("0");


    let vendors = $state<Vendor[]>([
        { name: "", model: "", purchase: undefined, shipping: undefined, fitup: undefined, misc: undefined, support: undefined, recommended: false },
    ]);


    function addVendor() {
        vendors.push({ name: "", model: "", purchase: undefined, shipping: undefined, fitup: undefined, misc: undefined, support: undefined, recommended: false });
        currentVendorIndex = (vendors.length - 1).toString();
    }

    function removeVendor(index: number) {
        vendors = vendors.filter((_, i) => i !== index);
        currentVendorIndex = Math.min(parseInt(currentVendorIndex) ?? 0, vendors.length - 1).toString();
    }

    /** Ensure only one vendor is recommended */
    function recommendVendor(index: number) {
        vendors.forEach((vendor, i) => {
            vendor.recommended = (i === index);
        });
    }

    // At least one vendor must have complete information (name, model, and at least one cost field) to submit
    let submitValid = $derived(
        vendors.some(vendor => vendor.name && vendor.model && vendor.purchase && (vendor.shipping || vendor.fitup || vendor.misc || vendor.support))
    );

    /** Facility Requirements */
    const utilityOptions = [
        { value: "power", label: "High power", icon: Zap },
        { value: "process_gases", label: "Process gases", icon: Cylinder },
        { value: "chemicals", label: "Chemicals", icon: FlaskConical },
        { value: "exhaust", label: "Exhaust", icon: Wind },
        { value: "di_water", label: "DI water", icon: Droplets },
        { value: "compressed_air", label: "Compressed air", icon: Fan },
        { value: "network", label: "Network", icon: Network },
        { value: "low_vibration", label: "Low vibration", icon: Activity },
    ];
    let utilities: string[] = $state([]);
    let utilityNote = $state("");

    const chip = "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary";



    /** Flags */
    const flagDefs = [
        { key: "hazardous_materials", label: "Uses hazardous gases or chemicals", hint: "EHS will review before it's powered up.", icon: Biohazard },
        { key: "facility_modification", label: "Needs facility modifications", hint: "New utilities, structural work, or a pedestal.", icon: HardHat },
        { key: "export_controlled", label: "Export-controlled", hint: "May need a license or extra paperwork.", icon: Globe },
        { key: "new_vendor", label: "Vendor is new to TxIE", hint: "Not on our current vendor list.", icon: Building },
        { key: "refurbished", label: "Used or refurbished", hint: "Adds inspection and decontamination steps.", icon: Recycle },
    ];
    let flags: Record<string, boolean> = $state(Object.fromEntries(flagDefs.map((f) => [f.key, false])));


</script>



<Tabs.Content value="vendors" class='gap-x-0 grid grid-cols-1 md:grid-cols-2 px-[5vw] w-full mx-auto max-w-8xl'>
    <aside>
        <div class='md:sticky top-0 pt-20 space-y-4 md:h-screen md:pt-28'>
            <h1 class='text-2xl font-medium'>03 - Vendors</h1>
        </div>
    </aside>

    
    <article class='md:pt-28 pb-28'>
        <Tabs.Root bind:value={ currentVendorIndex } >
            <Tabs.List class='mb-4 bg-transparent gap-2'>
                {#each vendors as vendor, index}
                <Tabs.Trigger value={index.toString()} class='p-3 h-7 data-active:bg-foreground data-active:text-background data-active:hover:text-background'>
                    { vendor.name || `Vendor ${ index + 1 }` }
                    {#if vendor.recommended}<Star class='size-4 stroke-0 fill-[#f59e0b]'/>{/if}
                </Tabs.Trigger>
                {/each}

                {#if vendors.length < 4 }
                <Button size='sm' variant='ghost' class='flex col-span-full w-max mx-auto gap-x-1 pr-4' onclick={ addVendor }><Plus class='size-4' /> Add Vendor</Button>
                {/if}
            </Tabs.List>

            
            {#each vendors as vendor, index }
            {@const total = (vendor.purchase ?? 0) + (vendor.shipping ?? 0) + (vendor.fitup ?? 0) + (vendor.misc ?? 0) + (vendor.support ?? 0) }
            {@const recc = vendor.recommended }
            <Tabs.Content value={ index.toString() }>
                <div class='grid grid-cols-2 gap-y-3 gap-x-4'>
                <Label for="manufacturer">Manufacturer</Label>
                <Label for="model">Model</Label>
        
                <Input bind:value={ vendors[index].name } id='vendor' type='text' placeholder='Applied Materials, LAM, Camtek ...' />
                <Input bind:value={vendors[index].model} id='model' type='text' placeholder='PJ9000' />
                </div>
                {@render Divider()}

                <Field.Set>
                    <Field.Legend variant="label">Facility Requirements</Field.Legend>
                    <Field.Description>What facility requirements will this equipment need? (e.g. power, water, gas, vacuum, etc.)</Field.Description>

                    <ToggleGroup.Root type="multiple" variant="outline" size="sm" spacing={2} bind:value={utilities} class="flex-wrap">
                        {#each utilityOptions as u (u.value)}
                            <ToggleGroup.Item value={u.value} class={chip}><u.icon class="size-4" /> {u.label}</ToggleGroup.Item>
                        {/each}
                    </ToggleGroup.Root>
                    {#if utilities.length}
                        <div transition:slide>
                            <Input bind:value={utilityNote} maxlength={140} aria-label="Utility details" placeholder="Specifics, e.g. 208 V 3-phase, 40 A, N2 and CDA" />
                        </div>
                    {/if}
                </Field.Set>
                <br>


                <Field.Set>
                <Field.Legend variant="label">Do any of the these apply for the equipment?</Field.Legend>
                <Field.Group class="grid items-center grid-cols-[auto_1fr_auto] gap-x-3 gap-y-3 mt-2">
                    {#each flagDefs as flag (flag.key)}
                        <flag.icon class="size-5 stroke-[1.2]" />
                        <p class='font-[350]'>{flag.label}</p>
                        <Switch id="flag-{flag.key}" bind:checked={flags[flag.key]} />
                    {/each}
                </Field.Group>
                </Field.Set>

                {@render Divider()}
        
                <h4 class='font-medium'>Cost</h4> 
                <p class='text-muted-foreground'>How much is the estimated cost for this tool? Any support equipment needed to be purchased or rented? If so, please provide an estimate of support equipment as well</p>
                <div class='mt-4 grid grid-cols-3 gap-y-3 gap-x-3 items-center'>
                    <label for='purpose' class='text-sm font-medium'>Est. Purchase</label>
                    <Currency class='col-span-2' bind:value={ vendors[index].purchase } />
        
                    <label for='purpose' class='text-sm font-medium'>Est. Shipping</label>
                    <Currency class='col-span-2' bind:value={ vendors[index].shipping } />
                    
                    <label for='purpose' class='text-sm font-medium'>Est. Fit-Up</label>
                    <Currency class='col-span-2' bind:value={ vendors[index].fitup } />
                    
                    <label for='purpose' class='text-sm font-medium'>Est. Miscellaneous & Fees</label>
                    <Currency class='col-span-2' bind:value={ vendors[index].misc } />
                    
                    <label for='purpose' class='text-sm font-medium'>Est. Support Equipment</label>
                    <Currency class='col-span-2' bind:value={ vendors[index].support } />
                </div>
                <br>
                <div class='grid grid-cols-[auto_auto_1fr_auto] gap-2 items-end mt-2'>
                    <Button onclick={ () => recommendVendor(index) } size='sm' variant='outline' class='flex items-center gap-2 pr-4'>
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
                {@render Divider()}

            
                <!-- Attachment -->
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
</Tabs.Content>


{#snippet Divider()}
    <br>
    <hr class='border-[0.5] border-dashed'>
    <br>
{/snippet}

