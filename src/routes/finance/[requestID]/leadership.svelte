<script lang="ts">
    import * as Tabs from "$lib/components/tabs";
    import { Label } from "$lib/components/label";
    import { Button } from "$lib/components/button";
    import * as RadioGroup from "$lib/components/radio-group";
    import * as InputGroup from "$lib/components/input-group";
    import * as Field from "$lib/components/field";
    import { formatCurrency } from "$lib/hooks/finance";
    import { BadgeCheck, Undo2, Gavel, MapPin, Sparkles, Clock, CircleX, Lock, Hourglass } from "@lucide/svelte";
    import type { Component } from "svelte";
    import { slide } from "svelte/transition";
    import { Currency } from "$lib/components/currency";
    import { database } from "$lib/data/smartsheet.svelte";
    import { budgetTotal, isLocked, parseBudget, parsePersonnel, parsePrograms, parseSpecs, versionOf } from "$lib/data/snapshot-fields";
    import type { Decision, PurchaseSnapshot } from "$lib/models/procurement";

    let { snapshot, onrevise }: { snapshot: PurchaseSnapshot; onrevise: (draftId: string) => void } = $props();

    // Read-only views of the proposal (budget amounts are in cents)
    const programs = $derived(parsePrograms(snapshot.programs));
    const personnel = $derived(parsePersonnel(snapshot.personnel));
    const specs = $derived(parseSpecs(snapshot.specs));
    const budgetLines = $derived(Object.entries(parseBudget(snapshot.budget)));
    const estimate = $derived(budgetTotal(snapshot.budget) / 100);

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

    // Working budget for sourcing, in dollars. Defaults to the engineer's total estimate.
    let budget = $state(budgetTotal(snapshot.budget) / 100);

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
</script>

<Tabs.Content value="leadership" class='gap-x-16 grid grid-cols-1 md:grid-cols-2 px-[5vw] w-full mx-auto max-w-8xl'>
    <aside class='pr-8 md:pt-28 pb-16'>
        <div class="mb-12">
            <h1 class='text-2xl font-medium font-display mb-2'>02 - FAB Leadership</h1>
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
                    <span class="flex items-center gap-1.5 capitalize"><Sparkles class="size-4" /> {snapshot.purpose_type.replaceAll('_', ' ')}</span>
                    <span class="flex items-center gap-1.5"><Clock class="size-4" /> Needed by {snapshot.target_date}</span>
                </div>
            </section>

            <hr class="border-dashed border-muted-foreground/30">

            <!-- Justification -->
            <section class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h4 class="font-medium text-sm text-muted-foreground mb-2 uppercase tracking-wider">What it does</h4>
                    <p class="text-foreground whitespace-pre-wrap">{snapshot.purpose_details ?? "—"}</p>
                </div>
                <div>
                    <h4 class="font-medium text-sm text-muted-foreground mb-2 uppercase tracking-wider">Current Gap</h4>
                    <p class="text-foreground whitespace-pre-wrap">{snapshot.current_gap ?? "—"}</p>
                </div>
            </section>

            <!-- Programs & Personnel -->
            <section class="grid grid-cols-1 md:grid-cols-2 gap-8 bg-accent/30">
                <div>
                    <h4 class="font-medium text-sm text-muted-foreground mb-3 uppercase tracking-wider">Programs Supported</h4>
                    <div class="flex flex-wrap gap-2">
                        {#each programs as prog}
                            <span class="px-2.5 py-1 bg-background border text-sm font-medium">{prog}</span>
                        {/each}
                    </div>
                </div>
                <div>
                    <h4 class="font-medium text-sm text-muted-foreground mb-3 uppercase tracking-wider">Personnel</h4>
                    <ul class="space-y-3">
                        {#each personnel as person}
                            <li class="text-sm">
                                <span class="font-medium block">{person.name}</span>
                                <span class="text-muted-foreground capitalize">{person.role.split('_').join(' ')} • {person.email}</span>
                            </li>
                        {/each}
                    </ul>
                </div>
            </section>

            <!-- Specs & Timeline -->
            <section class="grid grid-cols-1 md:grid-cols-2 gap-8">
                {#if specs.length > 0}
                <div>
                    <h4 class="font-medium text-sm text-muted-foreground mb-3 uppercase tracking-wider">Target Specifications</h4>
                    <dl class="space-y-2 text-sm">
                        {#each specs as spec}
                            <div class="grid grid-cols-[1fr_auto] border-b pb-2 border-dashed">
                                <dt class="text-muted-foreground">{spec.title}</dt>
                                <dd class="font-medium text-right">{spec.value}</dd>
                            </div>
                        {/each}
                    </dl>
                </div>
                {/if}
                {#if snapshot.date_firmness}
                <div>
                    <h4 class="font-medium text-sm text-muted-foreground mb-3 uppercase tracking-wider">Timeline Constraints</h4>
                    <dl class="space-y-2 text-sm">
                        <div class="grid grid-cols-[1fr_auto] border-b pb-2 border-dashed">
                            <dt class="text-muted-foreground">Firmness</dt>
                            <dd class="font-medium text-right capitalize">{snapshot.date_firmness}</dd>
                        </div>
                        <div class="grid grid-cols-[1fr_auto] border-b pb-2 border-dashed">
                            <dt class="text-muted-foreground">Forced Timeline</dt>
                            <dd class="font-medium text-right capitalize">{snapshot.date_force}</dd>
                        </div>
                        {#if snapshot.consequence}
                            <div class="pt-2">
                                <dt class="text-muted-foreground mb-1">Consequence if late</dt>
                                <dd class="font-medium">{snapshot.consequence}</dd>
                            </div>
                        {/if}
                    </dl>
                </div>
                {/if}
            </section>

            <hr class="border-dashed border-muted-foreground/30">

            <!-- Budget Envelope -->
            <section>
                <h4 class="font-medium text-sm text-muted-foreground mb-4 uppercase tracking-wider">Estimated Budget Envelope</h4>
                <div class="bg-background border overflow-hidden">
                    <div class="divide-y">
                        {#each budgetLines as [category, cents]}
                            <div class="grid grid-cols-[1fr_auto] p-4 items-center">
                                <span class="text-muted-foreground capitalize">{category.replaceAll('_', ' ')}</span>
                                <span class="font-medium">{formatCurrency((cents ?? 0) / 100)}</span>
                            </div>
                        {/each}
                    </div>
                    <div class="bg-muted/50 grid grid-cols-[1fr_auto] p-4 items-center border-t">
                        <span class="font-medium">Total Estimate</span>
                        <span class="font-medium text-xl">{formatCurrency(estimate)}</span>
                    </div>
                </div>
            </section>
        </div>
    </aside>

    <article class='grid grid-rows-[1fr_auto] md:sticky md:h-screen top-0 h-auto md:pt-28 pb-16'>
        
        <div class="space-y-8 mt-12 md:mt-0">
            {#if awaitingProposal}
                <div class="bg-accent/40 border p-6 flex flex-col gap-2">
                    <div class="flex items-center gap-3">
                        <Hourglass class="size-5 text-muted-foreground" />
                        <h3 class="font-medium text-lg">Waiting on the proposal</h3>
                    </div>
                    <p class="text-sm text-muted-foreground">This draft is still being edited. A decision can be made once it's forwarded to FAB Leadership.</p>
                </div>
            {:else if locked && snapshot.decision}
                <!-- Read-Only Locked State -->
                <div class="bg-accent/40 border p-6 flex flex-col gap-4">
                    <div class="flex items-center gap-3">
                        <Lock class="size-5 text-muted-foreground" />
                        <h3 class="font-medium text-lg">Fab Leadership Decision Locked</h3>
                    </div>
                    
                    <div class="grid grid-cols-[1fr_auto] border-b pb-2 border-dashed">
                        <span class="text-muted-foreground">Outcome</span>
                        <strong class={`uppercase text-sm ${outcomeStyle[snapshot.decision]}`}>
                            {snapshot.decision.replaceAll('_', ' ')}
                        </strong>
                    </div>

                    {#if snapshot.decision === 'approved'}
                        <div class="grid grid-cols-[1fr_auto] border-b pb-2 border-dashed">
                            <span class="text-muted-foreground">Approved Envelope</span>
                            <strong class="text-sm">{formatCurrency((snapshot.approved_budget ?? budgetTotal(snapshot.budget)) / 100)}</strong>
                        </div>
                    {/if}

                    <div class="pt-2">
                        <span class="text-muted-foreground block mb-1">Comments & Conditions</span>
                        <p class="text-sm">{snapshot.decision_comments || "None provided."}</p>
                    </div>
                </div>
            {:else}
                <!-- Active Form State -->
                <Field.Set>
                    <Field.Legend class='font-medium text-lg mb-1'>Decision</Field.Legend>
                    <Field.Description>Is this problem worth solving, at roughly this cost?</Field.Description>
                    
                    <RadioGroup.Root bind:value={decision} onfocusout={() => touched.decision = true} class='grid grid-cols-3 gap-3 mt-4'>
                        {@render DecisionCard("approved", decision, "Approve Envelope", BadgeCheck, "text-green-600")}
                        {@render DecisionCard("changes_requested", decision, "Request Changes", Undo2, "text-orange-500")}
                        {@render DecisionCard("rejected", decision, "Reject", CircleX, "text-red-500")}
                    </RadioGroup.Root>
                    {#if errors.decision}
                        <Field.Error class="mt-2">{errors.decision}</Field.Error>
                    {/if}
                </Field.Set>

                {#if decision === "approved" }
                <div transition:slide>
                    <Field.Set>
                        <Field.Legend class='font-medium'>Authorized Budget Envelope</Field.Legend>
                        <Field.Description>Set the working budget that will be used to source vendors. By default, this is the engineer's total estimate.</Field.Description>

                        <Currency bind:value={budget} placeholder={estimate.toString()} class="text-xl" />
                    </Field.Set>
                </div>
                {/if}

                <Field.Field>
                    <Field.Label for="comments" class='font-medium'>Comments & Conditions</Field.Label>
                    <InputGroup.Root class="mt-2">
                        <InputGroup.Textarea
                            id="comments"
                            bind:value={comments}
                            onblur={() => touched.comments = true}
                            class={`min-h-32 resize-none ${errors.comments ? 'border-destructive' : ''}`}
                            placeholder="Provide feedback, conditions of approval, or reasons for rejection..." />
                    </InputGroup.Root>
                    {#if errors.comments}
                        <Field.Error class="mt-2">{errors.comments}</Field.Error>
                    {/if}
                </Field.Field>
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

{#snippet DecisionCard(value: string, current: string, label: string, Icon: Component, styling: string)}
    <Label data-selected={ value === current } class={ 
    'cursor-pointer border flex flex-col items-center justify-center gap-2 px-2 py-4 transition-all opacity-70 hover:opacity-100 data-[selected=true]:bg-background data-[selected=true]:shadow-sm data-[selected=true]:opacity-100 data-[selected=true]:border-foreground/40' }>
        <RadioGroup.Item { value } class='hidden' />
        <Icon class={`size-6 stroke-[1.5] ${ styling }`} />
        <span class="text-sm font-medium text-center">{ label }</span>
    </Label>
{/snippet}