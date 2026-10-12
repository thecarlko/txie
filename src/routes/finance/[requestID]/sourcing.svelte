<script lang='ts'>
    import { ArrowRight, BadgeCheck, CircleX, Clock, MapPin, Plus, Star, Undo2 } from "@lucide/svelte";
    import { Button } from "$lib/components/button";
    import * as Tabs from "$lib/components/tabs";
    import { formatCurrency } from "$lib/hooks/finance";
    import { database } from "$lib/data/smartsheet.svelte";
    import { budgetTotal, isComplete, isLocked, isProposalComplete, parseSpecs, vendorTotal, versionOf } from "$lib/data/snapshot-fields";
    import { decisionLabel, formatDate } from "$lib/data/labels";
    import type { PurchaseSnapshot } from "$lib/models/procurement";
    import VendorForm from "./vendor-form.svelte";

    /** The request's latest draft. Vendors belong to the request, so every draft shares them. */
    let { snapshot, onforward }: { snapshot: PurchaseSnapshot; onforward: () => void } = $props();

    const specs = $derived(parseSpecs(snapshot.specs));
    const estimate = $derived(budgetTotal(snapshot.budget) / 100);

    // Editable until FAB Leadership decides; "changes requested" opens a new draft, which reopens them
    const locked = $derived(isLocked(snapshot));

    // When this draft exists because changes were requested, show what Leadership asked for
    const previous = $derived(database.get(`${snapshot.request_id}-${versionOf(snapshot) - 1}`));
    const requestedChanges = $derived(!locked && previous?.decision === "changes_requested" ? previous.decision_comments : null);

    const vendors = $derived(database.vendors.of(snapshot.request_id));

    // Falls back to the first vendor when nothing is picked yet or the pick was deleted
    let selected = $state<string>();
    const currentId = $derived(vendors.find((v) => v.id === selected)?.id ?? vendors[0]?.id ?? "");

    function addVendor() {
        selected = database.vendors.create(snapshot.request_id).id;
    }

    /** Remove a vendor and select its neighbour */
    function removeVendor(id: string) {
        const index = vendors.findIndex((v) => v.id === id);
        database.vendors.delete(id);
        selected = vendors[Math.min(index, vendors.length - 1)]?.id;
    }

    // Forwarding needs a complete proposal and a recommended vendor with a manufacturer, model, and purchase price
    const proposalReady = $derived(isProposalComplete(snapshot));
    const chosen = $derived(database.vendors.chosen(snapshot.request_id));
    const vendorReady = $derived(!!chosen && isComplete(chosen));

    /** Send the proposal and its vendors to FAB Leadership */
    function forward() {
        if (locked || snapshot.forwarded || !proposalReady || !vendorReady) return;
        database.forward(snapshot.id);
        onforward();
    }

    const eyebrow = "text-xs font-medium uppercase tracking-wider text-muted-foreground";
</script>

<Tabs.Content value="sourcing" class='grid grid-cols-1 md:grid-cols-2 gap-x-16 px-[5vw] w-full mx-auto max-w-8xl'>
    <!-- `contents` lets the aside and article sit directly on the page grid -->
    <Tabs.Root bind:value={() => currentId, (id) => (selected = id)} orientation='vertical' class='contents'>
        <aside>
            <div class='grid grid-rows-[auto_auto_1fr_auto] gap-10 md:sticky top-0 py-20 md:pt-28 h-auto md:h-screen'>
                <h1 class='text-2xl font-medium font-display'>02 - Sourcing</h1>

                <!-- What the proposal asks for, for reference while sourcing -->
                <section class='grid gap-4 border-y border-dashed py-6 text-sm'>
                    <header class='grid grid-cols-[1fr_auto] items-baseline gap-x-4 gap-y-2'>
                        <h2 class='text-lg font-medium'>{snapshot.purpose || "Untitled proposal"}</h2>
                        <span class={eyebrow}>{snapshot.request_id} · Draft {versionOf(snapshot)}</span>
                        <div class='col-span-full flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground'>
                            <span class='flex items-center gap-1.5 uppercase'><MapPin class='size-4' /> {snapshot.location}</span>
                            <span class='flex items-center gap-1.5'><Clock class='size-4' /> Needed by {formatDate(snapshot.target_date)}</span>
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

                    {#if requestedChanges}
                        <p class='grid gap-1.5'>
                            <span class='{eyebrow} flex items-center gap-1.5'><Undo2 class='size-3.5' /> Changes requested on draft {versionOf(previous!)}</span>
                            <span class='whitespace-pre-wrap'>{requestedChanges}</span>
                        </p>
                    {:else if locked && snapshot.decision_comments}
                        <p class='grid gap-1.5'>
                            <span class={eyebrow}>Leadership conditions</span>
                            <span class='whitespace-pre-wrap'>{snapshot.decision_comments}</span>
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

                    {#if !locked}
                        <Button size='sm' variant='outline' class='justify-self-center mt-6 gap-x-1 pr-4 border-dashed shadow-none' onclick={addVendor}>
                            <Plus class='size-4' /> Add Vendor
                        </Button>
                    {/if}
                </div>

                <footer class='grid grid-cols-[1fr_auto] items-end gap-4'>
                    <p class='grid gap-1'>
                        <span class={eyebrow}>Proposal estimate</span>
                        <strong class='text-xl font-medium tabular-nums'>{formatCurrency(estimate)}</strong>
                    </p>
                    {#if snapshot.decision === "approved"}
                        <span class='flex items-center gap-2 text-sm font-medium text-green-600'><BadgeCheck class='size-4' /> {decisionLabel.approved} {formatDate(snapshot.updated_at)}</span>
                    {:else if snapshot.decision}
                        <span class='flex items-center gap-2 text-sm font-medium text-red-600'><CircleX class='size-4' /> {decisionLabel[snapshot.decision]}</span>
                    {:else if snapshot.forwarded}
                        <span class='flex items-center gap-2 text-sm font-medium text-muted-foreground'><Clock class='size-4' /> Awaiting FAB Leadership</span>
                    {:else}
                        <Button disabled={!proposalReady || !vendorReady} onclick={forward} class='gap-3 pl-4'>
                            Forward to FAB Leadership <ArrowRight class='stroke-[1.5]' />
                        </Button>
                        {#if !proposalReady}
                            <p class='col-span-full text-xs text-muted-foreground text-right'>Finish the proposal first: location, purpose, current gap, personnel, and a purchase price.</p>
                        {:else if !vendorReady}
                            <p class='col-span-full text-xs text-muted-foreground text-right'>Recommend a vendor with a manufacturer, model, and purchase price to forward.</p>
                        {/if}
                    {/if}
                </footer>
            </div>
        </aside>

        <article class='md:pt-28 pb-28'>
            {#each vendors as vendor (vendor.id)}
                <Tabs.Content value={vendor.id}>
                    <VendorForm {vendor} {locked} onremove={() => removeVendor(vendor.id)} />
                </Tabs.Content>
            {:else}
                <p class='text-muted-foreground'>
                    {locked ? "No vendors were sourced for this request." : "No vendors yet. Add one to start comparing quotes against the proposal estimate."}
                </p>
            {/each}
        </article>
    </Tabs.Root>
</Tabs.Content>
