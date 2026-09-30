<script lang="ts">
    import * as Tabs from "$lib/components/tabs";
    import { Label } from "$lib/components/label";
    import { Button } from "$lib/components/button";
    import * as RadioGroup from "$lib/components/radio-group";
    import * as InputGroup from "$lib/components/input-group";
    import * as Field from "$lib/components/field";
    import { formatCurrency } from "$lib/hooks/finance";
    import { BadgeCheck, Undo2, Gavel, MapPin, Target, Sparkles, Clock, CircleX, RefreshCcwDot } from "@lucide/svelte";
    import type { Component } from "svelte";
    import { slide } from "svelte/transition";
    import { Currency } from "$lib/components/currency";

    // Mocking the frozen snapshot that would be passed down from the RequestVersion
    const snapshot = {
        request_number: "EPG-40",
        purpose: "Wafer Based Plasma Dicer",
        location: "Microelectronics Research Center (MER)",
        needType: "New capability",
        details: "Supports C4 bumping when pitch is 200 µm or more.\nSeveral customers are asking for 4 to 16 mil spheres, SnPb and SnAg.",
        gap: "Bumping is manual, slow, and error-prone. This automates it and raises throughput.",
        programs: ["PM6.2", "TV1"],
        personnel: [
            { name: "Sugento Huandra", email: "sugento_huandra@txie.org", role: "Equipment owner" },
            { name: "Akarsh Saggar", email: "akarsh@txie.org", role: "Operator" }
        ],
        receipt: [
            { category: "Purchase Price", amount: 280000 },
            { category: "Facility Fit-Up", amount: 15000 },
            { category: "Shipping & Freight", amount: 10000 }
        ],
        totalEstimate: 305000,
        due: "December 30, 2026",
        firmness: "Hard deadline",
        force: "No",
        consequence: "We miss the July milestones for the new product line.",
        specs: [
            { title: "Footprint / Dimensions", value: "2.5m x 1.8m" },
            { title: "Throughput", value: "100 WPH" }
        ]
    };

    // Decision State
    let decision: "approved" | "changes_requested" | "rejected" | "" = $state("");
    let comments = $state("");
    let touched = $state({ decision: false, comments: false });
    let submitted = $state(false);
    
    // Initialize the working budget with the engineer's total estimate
    let budget = $state(snapshot.totalEstimate);

    let errors = $derived({
        decision: (touched.decision || submitted) && !decision ? "A gate decision is required." : null,
        comments: (touched.comments || submitted) && comments.trim() === "" 
            ? "Comments are required when requesting changes or rejecting." : null
    });

    async function submitReview() {
        submitted = true;
        if (Object.values(errors).some(err => err !== null)) return;
        
        // Proceed to generate Review record and update Request.stage
        console.log("Decision recorded:", decision, comments, budget);
    }
</script>

<Tabs.Content value="leadership" class='gap-x-16 grid grid-cols-1 md:grid-cols-2 px-[5vw] w-full mx-auto max-w-8xl'>
    
    <aside class='pr-8 md:pt-28 pb-16'>
        <div class="mb-12">
            <h1 class='text-2xl font-medium font-display mb-2'>02 - FAB Leadership</h1>
        </div>
        
        <div class="flex items-center justify-between mb-8">
            <h2 class='font-medium text-xl text-muted-foreground'>Proposal Snapshot</h2>
            <div class="bg-muted px-3 py-1 rounded-md text-sm font-medium">{snapshot.request_number}</div>
        </div>

        <div class="space-y-12">
            <!-- Header Info -->
            <section>
                <h3 class="text-3xl font-medium mb-4">{snapshot.purpose}</h3>
                <div class="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span class="flex items-center gap-1.5"><MapPin class="size-4" /> {snapshot.location}</span>
                    <span class="flex items-center gap-1.5"><Sparkles class="size-4" /> {snapshot.needType}</span>
                    <span class="flex items-center gap-1.5"><Clock class="size-4" /> Needed by {snapshot.due}</span>
                </div>
            </section>

            <hr class="border-dashed border-muted-foreground/30">

            <!-- Justification -->
            <section class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h4 class="font-medium text-sm text-muted-foreground mb-2 uppercase tracking-wider">What it does</h4>
                    <p class="text-foreground whitespace-pre-wrap">{snapshot.details}</p>
                </div>
                <div>
                    <h4 class="font-medium text-sm text-muted-foreground mb-2 uppercase tracking-wider">Current Gap</h4>
                    <p class="text-foreground whitespace-pre-wrap">{snapshot.gap}</p>
                </div>
            </section>

            <!-- Programs & Personnel -->
            <section class="grid grid-cols-1 md:grid-cols-2 gap-8 bg-accent/30 rounded-lg">
                <div>
                    <h4 class="font-medium text-sm text-muted-foreground mb-3 uppercase tracking-wider">Programs Supported</h4>
                    <div class="flex flex-wrap gap-2">
                        {#each snapshot.programs as prog}
                            <span class="px-2.5 py-1 bg-background border rounded-md text-sm font-medium">{prog}</span>
                        {/each}
                    </div>
                </div>
                <div>
                    <h4 class="font-medium text-sm text-muted-foreground mb-3 uppercase tracking-wider">Personnel</h4>
                    <ul class="space-y-3">
                        {#each snapshot.personnel as person}
                            <li class="text-sm">
                                <span class="font-medium block">{person.name}</span>
                                <span class="text-muted-foreground">{person.role} • {person.email}</span>
                            </li>
                        {/each}
                    </ul>
                </div>
            </section>

            <!-- Specs & Timeline -->
            <section class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h4 class="font-medium text-sm text-muted-foreground mb-3 uppercase tracking-wider">Target Specifications</h4>
                    <dl class="space-y-2 text-sm">
                        {#each snapshot.specs as spec}
                            <div class="grid grid-cols-[1fr_auto] border-b pb-2 border-dashed">
                                <dt class="text-muted-foreground">{spec.title}</dt>
                                <dd class="font-medium text-right">{spec.value}</dd>
                            </div>
                        {/each}
                    </dl>
                </div>
                <div>
                    <h4 class="font-medium text-sm text-muted-foreground mb-3 uppercase tracking-wider">Timeline Constraints</h4>
                    <dl class="space-y-2 text-sm">
                        <div class="grid grid-cols-[1fr_auto] border-b pb-2 border-dashed">
                            <dt class="text-muted-foreground">Firmness</dt>
                            <dd class="font-medium text-right">{snapshot.firmness}</dd>
                        </div>
                        <div class="grid grid-cols-[1fr_auto] border-b pb-2 border-dashed">
                            <dt class="text-muted-foreground">Forced Timeline</dt>
                            <dd class="font-medium text-right">{snapshot.force}</dd>
                        </div>
                        <div class="pt-2">
                            <dt class="text-muted-foreground mb-1">Consequence if late</dt>
                            <dd class="font-medium">{snapshot.consequence}</dd>
                        </div>
                    </dl>
                </div>
            </section>

            <hr class="border-dashed border-muted-foreground/30">

            <!-- Budget Envelope -->
            <section>
                <h4 class="font-medium text-sm text-muted-foreground mb-4 uppercase tracking-wider">Estimated Budget Envelope</h4>
                <div class="bg-background border rounded-lg overflow-hidden">
                    <div class="divide-y">
                        {#each snapshot.receipt as line}
                            <div class="grid grid-cols-[1fr_auto] p-4 items-center">
                                <span class="text-muted-foreground">{line.category}</span>
                                <span class="font-medium">{formatCurrency(line.amount)}</span>
                            </div>
                        {/each}
                    </div>
                    <div class="bg-muted/50 grid grid-cols-[1fr_auto] p-4 items-center border-t">
                        <span class="font-medium">Total Estimate</span>
                        <span class="font-medium text-xl">{formatCurrency(snapshot.totalEstimate)}</span>
                    </div>
                </div>
            </section>
        </div>
    </aside>

    <article class='grid grid-rows-[1fr_auto] md:sticky md:h-screen top-0 h-auto md:pt-28 pb-16'>
        
        <div class="space-y-8 mt-12 md:mt-0">
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

                    <Currency bind:value={budget} placeholder={snapshot.totalEstimate.toString()} class="text-xl" />
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
        </div>

        <div class="pt-8">
            <Button onclick={submitReview} variant='default' class='w-full flex items-center justify-center gap-3 py-6 text-base'>
                <Gavel class='stroke-[1.5] size-5' /> Finalize Decision
            </Button>
        </div>
    </article>
</Tabs.Content>

{#snippet DecisionCard(value: string, current: string, label: string, Icon: Component, styling: string)}
    <Label data-selected={ value === current } class={ 
    'cursor-pointer border flex flex-col items-center justify-center gap-2 px-2 py-4 rounded-md transition-all opacity-70 hover:opacity-100 data-[selected=true]:bg-background data-[selected=true]:shadow-sm data-[selected=true]:opacity-100 data-[selected=true]:border-foreground/40' }>
        <RadioGroup.Item { value } class='hidden' />
        <Icon class={`size-6 stroke-[1.5] ${ styling }`} />
        <span class="text-sm font-medium text-center">{ label }</span>
    </Label>
{/snippet}