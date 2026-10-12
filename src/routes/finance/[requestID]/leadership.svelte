<script lang="ts">
    import { untrack } from "svelte";
    import { Clock, Gavel, Hourglass, Lock, MapPin, Sparkles, Star } from "@lucide/svelte";
    import * as Tabs from "$lib/components/tabs";
    import { Button } from "$lib/components/button";
    import { formatCurrency } from "$lib/hooks/finance";
    import { database } from "$lib/data/smartsheet.svelte";
    import { costLabel, decisionLabel, firmnessLabel, forceLabel, formatDate, needTypeLabel, roleLabel } from "$lib/data/labels";
    import { budgetTotal, isLocked, longestLeadTime, parseBudget, parsePersonnel, parsePrograms, parseSpecs, vendorTotal, versionOf } from "$lib/data/snapshot-fields";
    import type { CostCategory, Decision, PurchaseSnapshot } from "$lib/models/procurement";
    import DecisionField from "../fields/decision.svelte";

    let { snapshot, onrevise }: { snapshot: PurchaseSnapshot; onrevise: (draftId: string) => void } = $props();

    // Read-only views of the proposal (budget amounts are in cents)
    const programs = $derived(parsePrograms(snapshot.programs));
    const personnel = $derived(parsePersonnel(snapshot.personnel));
    const specs = $derived(parseSpecs(snapshot.specs));
    const budgetLines = $derived(Object.entries(parseBudget(snapshot.budget)) as [CostCategory, number][]);
    const estimate = $derived(budgetTotal(snapshot.budget) / 100);

    // Vendors sourced for the request (shared by every draft); the recommended one is what's being approved
    const vendors = $derived(database.vendors.of(snapshot.request_id));
    const chosen = $derived(database.vendors.chosen(snapshot.request_id));
    const quote = $derived(chosen ? vendorTotal(chosen) / 100 : null);

    // Leadership can only decide on a forwarded draft, and only once
    const locked = $derived(isLocked(snapshot));
    const awaitingProposal = $derived(!snapshot.forwarded && !locked);

    const outcomeStyle: Record<Decision, string> = {
        approved: "text-green-600",
        changes_requested: "text-orange-500",
        rejected: "text-red-600"
    };

    // --- Decision form ---
    let decision = $state<Decision | "">("");
    let comments = $state("");
    let touched = $state({ decision: false, comments: false });
    let submitted = $state(false);

    // Authorized budget, in dollars. Defaults to the recommended vendor's quote, else the engineer's estimate.
    let budget = $state(untrack(() => quote ?? estimate));

    let errors = $derived({
        decision: (touched.decision || submitted) && !decision ? "A gate decision is required." : null,
        comments: (touched.comments || submitted) && comments.trim() === "" && decision !== "approved"
            ? "Comments are required when requesting changes or rejecting." : null
    });

    function submitReview() {
        submitted = true;
        if (!decision || Object.values(errors).some(err => err !== null)) return;

        const draft = database.decide(snapshot.id, {
            decision,
            comments: comments.trim() || null,
            approved_budget: decision === "approved" ? Math.round(budget * 100) : null
        });

        // "Request changes" opened the next draft for the requester to edit
        if (draft) onrevise(draft.id);
    }

    const eyebrow = "font-medium text-sm text-muted-foreground uppercase tracking-wider";
</script>

<Tabs.Content value="leadership" class='gap-x-16 grid grid-cols-1 md:grid-cols-2 px-[5vw] w-full mx-auto max-w-8xl'>
    <aside class='pr-8 md:pt-28 pb-16'>
        <div class="mb-12">
            <h1 class='text-2xl font-medium font-display mb-2'>03 - FAB Leadership</h1>
        </div>

        <div class="flex items-center justify-between mb-8">
            <h2 class='font-medium text-xl text-muted-foreground'>Proposal Snapshot</h2>
            <div class="bg-muted px-3 py-1 rounded-md text-sm font-medium">{snapshot.request_id} · Draft {versionOf(snapshot)}</div>
        </div>

        <div class="space-y-12">
            <!-- Header Info -->
            <section>
                <h3 class="text-3xl font-medium mb-4">{snapshot.purpose}</h3>
                <div class="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span class="flex items-center gap-1.5 uppercase"><MapPin class="size-4" /> {snapshot.location}</span>
                    <span class="flex items-center gap-1.5"><Sparkles class="size-4" /> {needTypeLabel[snapshot.purpose_type]}</span>
                    <span class="flex items-center gap-1.5"><Clock class="size-4" /> Needed by {formatDate(snapshot.target_date)}</span>
                </div>
            </section>

            <hr class="border-dashed border-muted-foreground/30">

            <!-- Justification -->
            <section class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h4 class="{eyebrow} mb-2">What it does</h4>
                    <p class="text-foreground whitespace-pre-wrap">{snapshot.purpose_details ?? "—"}</p>
                </div>
                <div>
                    <h4 class="{eyebrow} mb-2">Current Gap</h4>
                    <p class="text-foreground whitespace-pre-wrap">{snapshot.current_gap ?? "—"}</p>
                </div>
            </section>

            <!-- Programs & Personnel -->
            <section class="grid grid-cols-1 md:grid-cols-2 gap-8 bg-accent/30">
                <div>
                    <h4 class="{eyebrow} mb-3">Programs Supported</h4>
                    <div class="flex flex-wrap gap-2">
                        {#each programs as prog (prog)}
                            <span class="px-2.5 py-1 bg-background border text-sm font-medium">{prog}</span>
                        {/each}
                    </div>
                </div>
                <div>
                    <h4 class="{eyebrow} mb-3">Personnel</h4>
                    <ul class="space-y-3">
                        {#each personnel as person, i (i)}
                            <li class="text-sm">
                                <span class="font-medium block">{person.name}</span>
                                <span class="text-muted-foreground">{roleLabel[person.role] ?? person.role} • {person.email}</span>
                            </li>
                        {/each}
                    </ul>
                </div>
            </section>

            <!-- Specs & Timeline -->
            <section class="grid grid-cols-1 md:grid-cols-2 gap-8">
                {#if specs.length > 0}
                    <div>
                        <h4 class="{eyebrow} mb-3">Target Specifications</h4>
                        <dl class="space-y-2 text-sm">
                            {#each specs as spec (spec.title)}
                                {@render Line(spec.title, spec.value)}
                            {/each}
                        </dl>
                    </div>
                {/if}
                <div>
                    <h4 class="{eyebrow} mb-3">Timeline Constraints</h4>
                    <dl class="space-y-2 text-sm">
                        {@render Line("Firmness", firmnessLabel[snapshot.date_firmness])}
                        {@render Line("Forced Timeline", forceLabel[snapshot.date_force])}
                        {#if snapshot.consequence}
                            <div class="pt-2">
                                <dt class="text-muted-foreground mb-1">Consequence if late</dt>
                                <dd class="font-medium">{snapshot.consequence}</dd>
                            </div>
                        {/if}
                    </dl>
                </div>
            </section>

            <hr class="border-dashed border-muted-foreground/30">

            <!-- Budget Envelope -->
            <section>
                <h4 class="{eyebrow} mb-4">Estimated Budget Envelope</h4>
                <div class="bg-background border overflow-hidden">
                    <div class="divide-y">
                        {#each budgetLines as [category, cents] (category)}
                            <div class="grid grid-cols-[1fr_auto] p-4 items-center">
                                <span class="text-muted-foreground">{costLabel[category] ?? category}</span>
                                <span class="font-medium">{formatCurrency(cents / 100)}</span>
                            </div>
                        {/each}
                    </div>
                    <div class="bg-muted/50 grid grid-cols-[1fr_auto] p-4 items-center border-t">
                        <span class="font-medium">Total Estimate</span>
                        <span class="font-medium text-xl">{formatCurrency(estimate)}</span>
                    </div>
                </div>
            </section>

            <!-- Sourced Vendors -->
            <section>
                <h4 class="{eyebrow} mb-4">Sourced Vendors</h4>
                {#if vendors.length}
                    <div class="bg-background border divide-y">
                        {#each vendors as v, index (v.id)}
                            {@const lead = longestLeadTime(v)}
                            <div class="grid grid-cols-[1fr_auto_auto] gap-x-6 p-4 items-center">
                                <span class="flex items-center gap-2 font-medium">
                                    {v.manufacturer || `Vendor ${index + 1}`} <span class="font-normal text-muted-foreground">{v.model}</span>
                                    {#if v.recommended}<Star class="size-4 stroke-0 fill-[#f59e0b]" />{/if}
                                </span>
                                <span class="text-sm text-muted-foreground">{lead ? `${lead} weeks` : "—"}</span>
                                <span class="font-medium tabular-nums">{formatCurrency(vendorTotal(v) / 100)}</span>
                            </div>
                        {/each}
                    </div>
                    {#if quote !== null}
                        <p class="mt-3 text-sm text-muted-foreground text-right">
                            Recommended quote is
                            <span class={quote > estimate ? "text-red-600" : "text-green-600"}>{formatCurrency(Math.abs(quote - estimate))} {quote > estimate ? "over" : "under"}</span>
                            the estimate
                        </p>
                    {/if}
                {:else}
                    <p class="text-sm text-muted-foreground">No vendors sourced.</p>
                {/if}
            </section>
        </div>
    </aside>

    <article class='grid grid-rows-[1fr_auto] md:sticky md:h-screen top-0 h-auto md:pt-28 pb-16'>
        <div class="space-y-8 mt-12 md:mt-0">
            {#if awaitingProposal}
                <div class="bg-accent/40 border p-6 flex flex-col gap-2">
                    <h3 class="flex items-center gap-3 font-medium text-lg"><Hourglass class="size-5 text-muted-foreground" /> Waiting on the proposal</h3>
                    <p class="text-sm text-muted-foreground">This draft is still being edited. A decision can be made once the proposal and its sourced vendors are forwarded to FAB Leadership.</p>
                </div>
            {:else if snapshot.decision}
                <div class="bg-accent/40 border p-6 flex flex-col gap-4">
                    <h3 class="flex items-center gap-3 font-medium text-lg"><Lock class="size-5 text-muted-foreground" /> Fab Leadership Decision Locked</h3>

                    <dl class="space-y-4">
                        {@render Line("Outcome", decisionLabel[snapshot.decision], `uppercase text-sm ${outcomeStyle[snapshot.decision]}`)}
                        {#if snapshot.decision === 'approved'}
                            {@render Line("Approved Envelope", formatCurrency((snapshot.approved_budget ?? budgetTotal(snapshot.budget)) / 100), "text-sm")}
                        {/if}
                        <div class="pt-2">
                            <dt class="text-muted-foreground mb-1">Comments & Conditions</dt>
                            <dd class="text-sm">{snapshot.decision_comments || "None provided."}</dd>
                        </div>
                    </dl>
                </div>
            {:else}
                <DecisionField
                    bind:decision
                    bind:budget
                    bind:comments
                    budgetPlaceholder={quote ?? estimate}
                    {errors}
                    ontouch={(field) => (touched[field] = true)} />
            {/if}
        </div>

        {#if !locked && !awaitingProposal}
            <div class="pt-8">
                <Button onclick={submitReview} variant='default' class='w-full flex items-center justify-center gap-3 py-6 text-base'>
                    <Gavel class='stroke-[1.5] size-5' /> Finalize Decision
                </Button>
            </div>
        {/if}
    </article>
</Tabs.Content>

<!-- A term / value row on a dashed rule -->
{#snippet Line(term: string, detail: string, detailClass = "")}
    <div class="grid grid-cols-[1fr_auto] border-b pb-2 border-dashed">
        <dt class="text-muted-foreground">{term}</dt>
        <dd class="font-medium text-right {detailClass}">{detail}</dd>
    </div>
{/snippet}
