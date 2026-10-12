<script lang='ts'>
    import { Lock } from "@lucide/svelte";
    import { formatCurrency } from "$lib/hooks/finance";
    import {
        costLabel, decisionLabel, firmnessLabel, forceLabel, formatDate,
        locationLabel, needTypeLabel, roleLabel
    } from "$lib/data/labels";
    import { budgetTotal, parseBudget, parsePersonnel, parsePrograms, parseSpecs, versionOf } from "$lib/data/snapshot-fields";
    import type { CostCategory, PurchaseSnapshot } from "$lib/models/procurement";

    /** Read-only proposal, shown in place of the form once a draft can no longer be edited */
    let { snapshot }: { snapshot: PurchaseSnapshot } = $props();

    const programs = $derived(parsePrograms(snapshot.programs));
    const personnel = $derived(parsePersonnel(snapshot.personnel));
    const specs = $derived(parseSpecs(snapshot.specs));
    const costs = $derived(Object.entries(parseBudget(snapshot.budget)) as [CostCategory, number][]);

    const dollars = (cents: number) => formatCurrency(cents / 100);

    const eyebrow = "text-xs font-medium uppercase tracking-wider text-muted-foreground";
    const rows = "grid grid-cols-[minmax(8rem,14rem)_1fr] gap-x-6 gap-y-3 text-sm";
</script>

<div class='grid gap-12'>
    {#if snapshot.decision}
        <p class='flex items-center gap-3 bg-accent/40 border p-4 text-sm text-muted-foreground'>
            <Lock class='size-4 shrink-0' />
            Draft {versionOf(snapshot)} is view only. FAB Leadership marked it {decisionLabel[snapshot.decision].toLowerCase()} on {formatDate(snapshot.updated_at)}.
        </p>
    {:else if snapshot.forwarded}
        <p class='flex items-center gap-3 bg-accent/40 border p-4 text-sm text-muted-foreground'>
            <Lock class='size-4 shrink-0' />
            Draft {versionOf(snapshot)} is view only. It has been forwarded to FAB Leadership and is awaiting review.
        </p>
    {/if}

    <!-- Where & why -->
    <section class='grid gap-4'>
        <h3 class={eyebrow}>Location and Purpose</h3>
        <h2 class='text-2xl font-medium'>{snapshot.purpose || "Untitled proposal"}</h2>
        <dl class={rows}>
            {@render Row("Location", `${locationLabel[snapshot.location]} (${snapshot.location})`)}
            {@render Row("Need", needTypeLabel[snapshot.purpose_type])}
            {@render Row("What it will do", snapshot.purpose_details)}
            {@render Row("What it fixes", snapshot.current_gap)}
        </dl>
    </section>

    <hr class='border-dashed'>

    <!-- Programs & personnel -->
    <section class='grid gap-4'>
        <h3 class={eyebrow}>Programs and Personnel</h3>
        <dl class={rows}>
            <dt class='text-muted-foreground'>Programs supported</dt>
            <dd>
                {#if programs.length}
                    <ul class='flex flex-wrap gap-2'>
                        {#each programs as program (program)}
                            <li class='px-2.5 py-0.5 border bg-background font-medium'>{program}</li>
                        {/each}
                    </ul>
                {:else}
                    —
                {/if}
            </dd>

            <dt class='text-muted-foreground'>Stakeholders</dt>
            <dd>
                {#if personnel.length}
                    <ul class='grid gap-2'>
                        {#each personnel as person, i (i)}
                            <li class='grid'>
                                <span class='font-medium'>{person.name} <span class='font-normal text-muted-foreground'>· {roleLabel[person.role] ?? person.role}</span></span>
                                {#if person.email}<a href='mailto:{person.email}' class='text-muted-foreground hover:underline w-max'>{person.email}</a>{/if}
                            </li>
                        {/each}
                    </ul>
                {:else}
                    —
                {/if}
            </dd>
        </dl>
    </section>

    <hr class='border-dashed'>

    <!-- Budget -->
    <section class='grid gap-4'>
        <h3 class={eyebrow}>Estimated Budget</h3>
        <dl class='grid grid-cols-[1fr_auto] gap-x-6 gap-y-3 text-sm'>
            {#each costs as [category, cents] (category)}
                <dt class='text-muted-foreground'>{costLabel[category] ?? category}</dt>
                <dd class='text-right tabular-nums'>{dollars(cents)}</dd>
            {/each}
            <dt class='border-t pt-3 font-medium'>Total estimated cost</dt>
            <dd class='border-t pt-3 text-right tabular-nums text-xl font-medium'>{dollars(budgetTotal(snapshot.budget))}</dd>
        </dl>
    </section>

    <hr class='border-dashed'>

    <!-- Specs -->
    <section class='grid gap-4'>
        <h3 class={eyebrow}>Target Specifications</h3>
        {#if specs.length}
            <dl class={rows}>
                {#each specs as spec (spec.title)}
                    {@render Row(spec.title, spec.value)}
                {/each}
            </dl>
        {:else}
            <p class='text-sm text-muted-foreground'>No specifications given.</p>
        {/if}
    </section>

    <hr class='border-dashed'>

    <!-- Timeline -->
    <section class='grid gap-4'>
        <h3 class={eyebrow}>Target Operational Date</h3>
        <dl class={rows}>
            {@render Row("Installed & operational by", formatDate(snapshot.target_date))}
            {@render Row("Date firmness", firmnessLabel[snapshot.date_firmness])}
            {@render Row("Forcing the timeline", forceLabel[snapshot.date_force])}
            {@render Row("If it's late", snapshot.consequence)}
        </dl>
    </section>
</div>

{#snippet Row(term: string, detail: string | null | undefined)}
    <dt class='text-muted-foreground'>{term}</dt>
    <dd class='whitespace-pre-wrap'>{detail || "—"}</dd>
{/snippet}
