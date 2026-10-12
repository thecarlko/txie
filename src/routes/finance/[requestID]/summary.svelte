<script lang='ts'>
    import { CircleX, Clock, Hourglass, MapPin, PackageSearch, Star } from "@lucide/svelte";
    import * as Tabs from "$lib/components/tabs";
    import { formatCurrency } from "$lib/hooks/finance";
    import { database } from "$lib/data/smartsheet.svelte";
    import {
        budgetTotal, longestLeadTime, parseBudget, parseFootprint, parseList, parsePersonnel, parsePrograms,
        parseSpecs, parseSupportItems, vendorTotal, versionOf
    } from "$lib/data/snapshot-fields";
    import {
        costLabel, decisionLabel, firmnessLabel, flagLabel, forceLabel, formatDate,
        locationLabel, needTypeLabel, roleLabel, utilityLabel
    } from "$lib/data/labels";
    import type { CostCategory, PurchaseSnapshot, Utility, VendorFlag } from "$lib/models/procurement";

    /** Every draft of the request, oldest first */
    let { versions }: { versions: PurchaseSnapshot[] } = $props();

    // The summary needs an approved proposal with a recommended vendor
    const latest = $derived(versions.at(-1)!);
    const approved = $derived(versions.findLast((v) => v.decision === "approved"));
    const vendors = $derived(approved ? database.vendors.of(approved.request_id) : []);
    const chosen = $derived(vendors.find((v) => v.recommended));

    const envelope = $derived(approved ? (approved.approved_budget ?? budgetTotal(approved.budget)) : 0);
    const total = $derived(chosen ? vendorTotal(chosen) : 0);
    const decisions = $derived(versions.filter((v) => v.decision));

    const dollars = (cents: number) => formatCurrency(cents / 100);
    const weeks = (n: number | null) => (n ? `${n} weeks` : null);

    /** "2500x1800x" → "2500 × 1800 × — mm" */
    function size(footprint: string | null) {
        const { length, width, height } = parseFootprint(footprint);
        return footprint ? `${[length, width, height].map((side) => side || "—").join(" × ")} mm` : null;
    }

    const eyebrow = "text-xs font-medium uppercase tracking-wider text-muted-foreground";
    const rows = "grid grid-cols-[minmax(8rem,14rem)_1fr] gap-x-6 gap-y-3 text-sm";
</script>

<Tabs.Content value="summary" class='grid grid-cols-1 md:grid-cols-2 gap-x-16 px-[5vw] w-full mx-auto max-w-8xl'>
    <aside>
        <div class='grid grid-rows-[auto_auto_1fr] gap-10 md:sticky top-0 py-20 md:pt-28 h-auto md:h-screen'>
            <h1 class='text-2xl font-medium font-display'>04 - Executive Summary</h1>

            {#if approved && chosen}
                <header class='grid gap-2 border-y border-dashed py-6'>
                    <span class={eyebrow}>{approved.request_id} · Draft {versionOf(approved)} · Approved {formatDate(approved.updated_at)}</span>
                    <h2 class='text-2xl font-medium'>{approved.purpose}</h2>
                    <div class='flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground'>
                        <span class='flex items-center gap-1.5 uppercase'><MapPin class='size-4' /> {approved.location}</span>
                        <span class='flex items-center gap-1.5'><Clock class='size-4' /> Needed by {formatDate(approved.target_date)}</span>
                    </div>
                </header>

                <!-- Key figures -->
                <dl class='grid grid-cols-[1fr_auto] content-start gap-x-4 gap-y-3 text-sm'>
                    <dt class='text-muted-foreground'>Procuring</dt>
                    <dd class='font-medium text-right'>{chosen.manufacturer} {chosen.model}</dd>
                    <dt class='text-muted-foreground'>Total cost</dt>
                    <dd class='font-medium text-right tabular-nums'>{dollars(total)}</dd>
                    <dt class='text-muted-foreground'>Approved envelope</dt>
                    <dd class='font-medium text-right tabular-nums'>{dollars(envelope)}</dd>
                    <dt class='text-muted-foreground'>{total > envelope ? "Over envelope" : "Under envelope"}</dt>
                    <dd class='font-medium text-right tabular-nums {total > envelope ? "text-red-600" : "text-green-600"}'>{dollars(Math.abs(envelope - total))}</dd>
                    <dt class='text-muted-foreground'>Longest lead time</dt>
                    <dd class='font-medium text-right'>{weeks(longestLeadTime(chosen)) ?? "—"}</dd>
                    <dt class='text-muted-foreground'>Vendors considered</dt>
                    <dd class='font-medium text-right'>{vendors.length}</dd>
                </dl>
            {/if}
        </div>
    </aside>

    <article class='md:pt-28 pb-28'>
        {#if !approved && latest.decision === "rejected"}
            {@render Empty(CircleX, "FAB Leadership rejected this request", latest.decision_comments || "No summary is produced for rejected requests.")}
        {:else if !approved}
            {@render Empty(Hourglass, "Waiting on FAB Leadership", "The summary is put together once FAB Leadership approves a draft of this proposal and its sourced vendors.")}
        {:else if !chosen}
            {@render Empty(PackageSearch, "No recommended vendor", `This request was approved with ${vendors.length} vendor${vendors.length === 1 ? "" : "s"} quoted but none recommended, so there's no equipment to summarize.`)}
        {:else}
            {@const specs = parseSpecs(approved.specs)}
            {@const programs = parsePrograms(approved.programs)}
            {@const personnel = parsePersonnel(approved.personnel)}
            {@const costs = Object.entries(parseBudget(chosen.costs)) as [CostCategory, number][]}
            {@const items = parseSupportItems(chosen.support_items)}
            {@const utilities = parseList<Utility>(chosen.utilities)}
            {@const flags = parseList<VendorFlag>(chosen.flags)}

            <div class='grid gap-12'>
                <!-- Capability and Application -->
                <section class='grid gap-4'>
                    <h3 class={eyebrow}>Capability and Application</h3>
                    <dl class={rows}>
                        {@render Row("Need", needTypeLabel[approved.purpose_type])}
                        {@render Row("Programs supported", programs.join(", "))}
                        {@render Row("Capability fulfilled", approved.purpose_details)}
                        {@render Row("Why current tools fall short", approved.current_gap)}
                        {@render Row("Location", locationLabel[approved.location])}
                        {@render Row("Specifications", specs.map((s) => `${s.title}: ${s.value}`).join("\n"))}
                    </dl>
                </section>

                <hr class='border-dashed'>

                <!-- FAB Leadership -->
                <section class='grid gap-4'>
                    <h3 class={eyebrow}>FAB Leadership</h3>
                    <ol class='grid gap-4 text-sm'>
                        {#each decisions as draft (draft.id)}
                            <li class='grid grid-cols-[minmax(8rem,14rem)_1fr] gap-x-6'>
                                <span class='text-muted-foreground'>Draft {versionOf(draft)} · {formatDate(draft.updated_at)}</span>
                                <p class='grid gap-1'>
                                    <strong class='font-medium'>{decisionLabel[draft.decision!]}</strong>
                                    {#if draft.decision_comments}<span class='whitespace-pre-wrap'>{draft.decision_comments}</span>{/if}
                                </p>
                            </li>
                        {/each}
                    </ol>
                    <dl class={rows}>
                        {@render Row("Approved envelope", dollars(envelope))}
                    </dl>
                </section>

                <hr class='border-dashed'>

                <!-- Equipment -->
                <section class='grid gap-4'>
                    <h3 class={eyebrow}>Equipment</h3>
                    <dl class={rows}>
                        {@render Row("Make / Model", `${chosen.manufacturer} ${chosen.model}`)}
                        {@render Row("Configuration", chosen.configuration)}
                        {@render Row("Lead time", weeks(chosen.lead_time_weeks))}
                        {@render Row("Stakeholders", personnel.map((p) => `${p.name} (${roleLabel[p.role] ?? p.role})`).join("\n"))}
                    </dl>
                </section>

                <hr class='border-dashed'>

                <!-- Costs -->
                <section class='grid gap-4'>
                    <h3 class={eyebrow}>Costs</h3>
                    <dl class='grid grid-cols-[1fr_auto] gap-x-6 gap-y-3 text-sm'>
                        {#each costs as [category, cents] (category)}
                            <dt class='text-muted-foreground'>{costLabel[category] ?? category}</dt>
                            <dd class='text-right tabular-nums'>{dollars(cents)}</dd>
                        {/each}
                        {#if chosen.discount}
                            <dt class='text-muted-foreground'>Discount</dt>
                            <dd class='text-right tabular-nums text-green-600'>−{dollars(chosen.discount)}</dd>
                        {/if}
                        <dt class='border-t pt-3 font-medium'>Total</dt>
                        <dd class='border-t pt-3 text-right tabular-nums text-xl font-medium'>{dollars(total)}</dd>
                    </dl>
                </section>

                {#if items.length}
                    <section class='grid gap-4'>
                        <h3 class={eyebrow}>Support Equipment</h3>
                        <dl class={rows}>
                            {#each items as item, index (index)}
                                {@render Row(item.name, [dollars(item.cost), weeks(item.lead_time_weeks), size(item.size)].filter(Boolean).join(" · "))}
                            {/each}
                        </dl>
                    </section>
                {/if}

                <hr class='border-dashed'>

                <!-- Facilities and Installation -->
                <section class='grid gap-4'>
                    <h3 class={eyebrow}>Facilities and Installation</h3>
                    <dl class={rows}>
                        {@render Row("Tool size", size(chosen.footprint))}
                        {@render Row("Utilities", utilities.map((u) => utilityLabel[u] ?? u).join(", "))}
                        {@render Row("Utility details", chosen.utility_notes)}
                        {@render Row("Capacity analysis", chosen.facility_analysis ? "Completed" : "Not completed")}
                        {#if flags.includes("facility_modification")}
                            {@render Row("Facility work", [chosen.facility_work, weeks(chosen.facility_lead_time_weeks)].filter(Boolean).join(" · "))}
                            {@render Row("Facilities approval", chosen.facility_approved ? "Informed and approved" : "Not yet approved")}
                        {/if}
                        {@render Row("Flags", flags.map((f) => flagLabel[f] ?? f).join("\n") || "None")}
                    </dl>
                </section>

                <hr class='border-dashed'>

                <!-- Schedule -->
                <section class='grid gap-4'>
                    <h3 class={eyebrow}>Schedule</h3>
                    <dl class={rows}>
                        {@render Row("Needed by", formatDate(approved.target_date))}
                        {@render Row("Date firmness", firmnessLabel[approved.date_firmness])}
                        {@render Row("Forcing the timeline", forceLabel[approved.date_force])}
                        {@render Row("If it's late", approved.consequence)}
                    </dl>
                </section>

                <hr class='border-dashed'>

                <!-- Vendors considered -->
                <section class='grid gap-4'>
                    <h3 class={eyebrow}>Vendors Considered</h3>
                    <dl class='grid grid-cols-[1fr_auto_auto] gap-x-6 gap-y-3 text-sm'>
                        {#each vendors as v (v.id)}
                            <dt class='flex items-center gap-2'>
                                {v.manufacturer || "Unnamed vendor"} <span class='text-muted-foreground'>{v.model}</span>
                                {#if v.recommended}<Star class='size-4 stroke-0 fill-[#f59e0b]' />{/if}
                            </dt>
                            <dd class='text-muted-foreground'>{weeks(longestLeadTime(v)) ?? "—"}</dd>
                            <dd class='text-right tabular-nums'>{dollars(vendorTotal(v))}</dd>
                        {/each}
                    </dl>
                </section>
            </div>
        {/if}
    </article>
</Tabs.Content>

{#snippet Row(term: string, detail: string | null | undefined)}
    <dt class='text-muted-foreground'>{term}</dt>
    <dd class='whitespace-pre-wrap'>{detail || "—"}</dd>
{/snippet}

{#snippet Empty(Icon: typeof Hourglass, title: string, body: string)}
    <div class='grid gap-2 bg-accent/40 border p-6'>
        <h3 class='flex items-center gap-3 font-medium text-lg'><Icon class='size-5 text-muted-foreground' /> {title}</h3>
        <p class='text-sm text-muted-foreground whitespace-pre-wrap'>{body}</p>
    </div>
{/snippet}
