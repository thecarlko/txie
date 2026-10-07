<script lang='ts'>
    import { ArrowRight, CircleCheck, Clock, Lock, MapPin, Plus, Star } from "@lucide/svelte";
    import { Button } from "$lib/components/button";
    import * as Tabs from "$lib/components/tabs";
    import { formatCurrency } from "$lib/hooks/finance";
    import { database } from "$lib/data/smartsheet.svelte";
    import { budgetTotal, isComplete, parseSpecs, vendorTotal, versionOf } from "$lib/data/snapshot-fields";
    import { formatDate } from "$lib/data/labels";
    import type { PurchaseSnapshot } from "$lib/models/procurement";
    import VendorForm from "./vendor-form.svelte";

    /** The draft FAB Leadership approved; sourcing can't start without one */
    let { approved, onsubmit }: { approved?: PurchaseSnapshot; onsubmit: () => void } = $props();

    const specs = $derived(parseSpecs(approved?.specs ?? null));
    const envelope = $derived(approved ? (approved.approved_budget ?? budgetTotal(approved.budget)) / 100 : 0);

    /** Vendors live in their own table, grouped by the request they're quoted for */
    const vendors = $derived(approved ? database.vendors.of(approved.request_id) : []);
    const submittedAt = $derived(approved ? database.vendors.submittedAt(approved.request_id) : null);

    // Falls back to the first vendor when nothing is picked yet or the pick was deleted
    let selected = $state<string>();
    const currentId = $derived(vendors.find((v) => v.id === selected)?.id ?? vendors[0]?.id ?? "");

    function addVendor() {
        if (approved) selected = database.vendors.create(approved.request_id).id;
    }

    /** Remove a vendor and select its neighbour */
    function removeVendor(id: string) {
        const index = vendors.findIndex((v) => v.id === id);
        database.vendors.delete(id);
        selected = vendors[Math.min(index, vendors.length - 1)]?.id;
    }

    // The recommended vendor must have a manufacturer, model, and purchase price to submit
    const recommended = $derived(vendors.find((v) => v.recommended));
    const submitValid = $derived(!!recommended && isComplete(recommended));

    /** Lock the vendors and hand off to the executive summary */
    function submitVendors() {
        if (!approved || !submitValid) return;
        database.vendors.submit(approved.request_id);
        onsubmit();
    }

    const eyebrow = "text-xs font-medium uppercase tracking-wider text-muted-foreground";
</script>

<Tabs.Content value="sourcing" class='grid grid-cols-1 md:grid-cols-2 gap-x-16 px-[5vw] w-full mx-auto max-w-8xl'>
    <!-- `contents` lets the aside and article sit directly on the page grid -->
    <Tabs.Root bind:value={() => currentId, (id) => (selected = id)} orientation='vertical' class='contents'>
        <aside>
            <div class='grid grid-rows-[auto_auto_1fr_auto] gap-10 md:sticky top-0 py-20 md:pt-28 h-auto md:h-screen'>
                <h1 class='text-2xl font-medium font-display'>03 - Sourcing</h1>

                {#if approved}
                    <!-- What Proposal & Leadership agreed on, for reference while sourcing -->
                    <section class='grid gap-4 border-y border-dashed py-6 text-sm'>
                        <header class='grid grid-cols-[1fr_auto] items-baseline gap-x-4 gap-y-2'>
                            <h2 class='text-lg font-medium'>{approved.purpose}</h2>
                            <span class={eyebrow}>{approved.request_id} · Draft {versionOf(approved)}</span>
                            <div class='col-span-full flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground'>
                                <span class='flex items-center gap-1.5 uppercase'><MapPin class='size-4' /> {approved.location}</span>
                                <span class='flex items-center gap-1.5'><Clock class='size-4' /> Needed by {approved.target_date}</span>
                            </div>
                        </header>

                        {#if specs.length}
                            <dl class='grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5'>
                                <dt class='col-span-full {eyebrow}'>Target specifications</dt>
                                {#each specs as spec (spec.title)}
                                    <dd class='text-muted-foreground'>{spec.title}</dd>
                                    <dd class='font-medium text-right'>{spec.value}</dd>
                                {/each}
                            </dl>
                        {/if}

                        {#if approved.decision_comments}
                            <p class='grid gap-1.5'>
                                <span class={eyebrow}>Leadership conditions</span>
                                <span class='whitespace-pre-wrap'>{approved.decision_comments}</span>
                            </p>
                        {/if}
                    </section>

                    <div class='grid content-start min-h-0 overflow-y-auto'>
                        <Tabs.List class='w-full bg-transparent p-0 gap-1'>
                            {#each vendors as vendor, index (vendor.id)}
                                <Tabs.Trigger value={vendor.id} class='h-auto py-2 px-3 grid grid-cols-[1fr_auto] data-active:bg-foreground data-active:text-background data-active:hover:text-background'>
                                    <span class='flex items-center gap-2 truncate'>
                                        {vendor.manufacturer || `Vendor ${index + 1}`}
                                        {#if vendor.model}<span class='opacity-60 font-normal'>{vendor.model}</span>{/if}
                                        {#if vendor.recommended}<Star class='size-4 stroke-0 fill-[#f59e0b]' />{/if}
                                    </span>
                                    <span class='tabular-nums font-normal'>{formatCurrency(vendorTotal(vendor) / 100)}</span>
                                </Tabs.Trigger>
                            {/each}
                        </Tabs.List>

                        {#if !submittedAt}
                            <Button size='sm' variant='outline' class='justify-self-center mt-6 gap-x-1 pr-4 border-dashed shadow-none' onclick={addVendor}>
                                <Plus class='size-4' /> Add Vendor
                            </Button>
                        {/if}
                    </div>

                    <footer class='grid grid-cols-[1fr_auto] items-end gap-4'>
                        <p class='grid gap-1'>
                            <span class={eyebrow}>Approved budget envelope</span>
                            <strong class='text-xl font-medium tabular-nums'>{formatCurrency(envelope)}</strong>
                        </p>
                        {#if submittedAt}
                            <span class='flex items-center gap-2 text-sm font-medium text-green-600'><CircleCheck class='size-4' /> Submitted {formatDate(submittedAt)}</span>
                        {:else}
                            <Button type='submit' disabled={!submitValid} onclick={submitVendors} class='gap-3 pl-4'>
                                Submit Vendors <ArrowRight class='stroke-[1.5]' />
                            </Button>
                            {#if !submitValid}
                                <p class='col-span-full text-xs text-muted-foreground text-right'>Recommend a vendor with a manufacturer, model, and purchase price to submit.</p>
                            {/if}
                        {/if}
                    </footer>
                {/if}
            </div>
        </aside>

        <article class='md:pt-28 pb-28'>
            {#if approved}
                {#each vendors as vendor (vendor.id)}
                    <Tabs.Content value={vendor.id}>
                        <VendorForm {vendor} onremove={() => removeVendor(vendor.id)} />
                    </Tabs.Content>
                {:else}
                    <p class='text-muted-foreground'>No vendors yet. Add one to start comparing quotes against the approved envelope.</p>
                {/each}
            {:else}
                <div class='grid gap-2 bg-accent/40 border p-6'>
                    <h3 class='flex items-center gap-3 font-medium text-lg'><Lock class='size-5 text-muted-foreground' /> Waiting on an approved proposal</h3>
                    <p class='text-sm text-muted-foreground'>Sourcing opens once FAB Leadership approves a draft of this proposal. The approved scope and budget envelope will appear here to guide vendor selection.</p>
                </div>
            {/if}
        </article>
    </Tabs.Root>
</Tabs.Content>
