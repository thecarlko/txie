<script lang="ts">
    import type { Component } from "svelte";
    import { slide } from "svelte/transition";
    import { CalendarDate, DateFormatter, getLocalTimeZone, today, type DateValue } from "@internationalized/date";

    import * as Tabs from "$lib/components/tabs";
    import * as Field from "$lib/components/field";
    import * as RadioGroup from "$lib/components/radio-group";
    import * as ToggleGroup from "$lib/components/toggle-group";
    import * as InputGroup from "$lib/components/input-group";
    import * as Select from "$lib/components/select";
    import * as Popover from "$lib/components/popover";
    import * as Collapsible from "$lib/components/collapsible";
    import * as Attachment from "$lib/components/attachment";
    import { Calendar } from "$lib/components/calendar";
    import { Input } from "$lib/components/input";
    import { Label } from "$lib/components/label";
    import { Button } from "$lib/components/button";
    import { Switch } from "$lib/components/switch";
    import { Slider } from "$lib/components/slider";
    import { Badge } from "$lib/components/badge";
    import { Progress } from "$lib/components/progress";
    import {
        Lightbulb, MapPin, ClipboardList, Wallet, ShieldCheck, Target, CalendarDays, Users,
        Sparkles, Replace, Gauge, Hourglass, RotateCcw, TestTubeDiagonal, Factory,
        Zap, Cylinder, FlaskConical, Wind, Droplets, Fan, Network, Activity,
        Biohazard, HardHat, Globe, Building2, Recycle,
        Truck, Wrench, GraduationCap, Package, Handshake, Ellipsis, Landmark,
        UserRound, UserRoundPlus, Trash, Plus, X, Upload, FileText, Save, ArrowRight, ChevronDown, Circle, CircleCheck,

        Building

    } from "@lucide/svelte";
    import { generateID } from "$lib/hooks/hash";
    import { DatePicker } from "$lib/components/date-picker";

    type Props = {
        /** Signed-in user. When provided, the requester fields are prefilled and read-only. */
        user?: { name: string; email: string };
        /** Receives the finished proposal. Field names follow context.md section 8.4. */
        onsubmit?: (payload: Record<string, unknown>) => void | Promise<void>;
    };
    let { user, onsubmit }: Props = $props();

    /* ───────────────────────── Reference data ─────────────────────────
       TODO: load locations and programs from the Location / Program tables (context.md 8.1). */

    const locations = [
        { value: "mer", label: "Microelectronics Research Center", code: "MER", icon: TestTubeDiagonal },
        { value: "mr2", label: "Montopolis Fabrication Bldg.", code: "MR2", icon: Factory },
    ];

    const programGroups = [
        { label: "Process Module", items: ["PM6.2", "PM6.3", "PM6.4"] },
        { label: "Test Vehicle", items: ["TV1", "TV2", "TV3"] },
        { label: "Other", items: ["LAX"] },
    ];

    const needTypes = [
        { value: "new_capability", label: "New capability", hint: "Something we can't do today", icon: Sparkles },
        { value: "replacement", label: "Replacement", hint: "Swap out an existing tool", icon: Replace },
        { value: "capacity", label: "More capacity", hint: "Demand is outgrowing what we have", icon: Gauge },
        { value: "end_of_life", label: "End of life", hint: "Vendor support is ending", icon: Hourglass },
        { value: "recurring_failure", label: "Keeps failing", hint: "Repeated downtime or repairs", icon: RotateCcw },
    ];

    const alternativeOptions = [
        { value: "existing_tool", label: "Use an existing tool" },
        { value: "partner", label: "Outsource or use a partner" },
        { value: "refurbished", label: "Buy used or refurbished" },
        { value: "do_nothing", label: "Do nothing" },
    ];

    const extraCosts = [
        { key: "freight", label: "Shipping and freight", icon: Truck },
        { key: "install_services", label: "Vendor installation", icon: Wrench },
        { key: "fit_up", label: "Facility fit-up", icon: HardHat },
        { key: "training", label: "Training", icon: GraduationCap },
        { key: "spares", label: "Spare parts", icon: Package },
        { key: "service_contract", label: "Service contract", icon: Handshake },
        { key: "additional", label: "Anything else", icon: Ellipsis },
    ];

    const confidenceOptions = [
        { value: "rough_guess", label: "Rough guess" },
        { value: "budgetary_quote", label: "Budgetary quote" },
        { value: "firm_quote", label: "Firm quote" },
    ];

    const fundSources = [
        { value: "program", label: "Program funds" },
        { value: "federal_state", label: "Federal or state grant" },
        { value: "internal", label: "Internal operating" },
        { value: "unsure", label: "Not sure yet" },
    ];

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

    const flagDefs = [
        { key: "hazardous_materials", label: "Uses hazardous gases or chemicals", hint: "EHS will review before it's powered up.", icon: Biohazard },
        { key: "facility_modification", label: "Needs facility modifications", hint: "New utilities, structural work, or a pedestal.", icon: HardHat },
        { key: "export_controlled", label: "Export-controlled", hint: "May need a license or extra paperwork.", icon: Globe },
        { key: "new_vendor", label: "Vendor is new to TIE", hint: "Not on our current vendor list.", icon: Building },
        { key: "refurbished", label: "Used or refurbished", hint: "Adds inspection and decontamination steps.", icon: Recycle },
    ];

    const specPresets = [
        { label: "Throughput", unit: "wafers/hr" },
        { label: "Accuracy", unit: "±µm" },
        { label: "Wafer size", unit: "mm" },
        { label: "Min. feature size", unit: "µm" },
        { label: "Temperature range", unit: "°C" },
        { label: "Uptime", unit: "%" },
    ];

    const roles = [
        { value: "equipment_owner", label: "Equipment owner" },
        { value: "operator", label: "Operator" },
        { value: "backup_operator", label: "Backup operator" },
        { value: "maintenance", label: "Maintenance" },
    ];

    const sectionMeta = [
        { key: "ask", label: "The ask", icon: Lightbulb, required: ["title", "needType", "existingTool", "details"] },
        { key: "where", label: "Where and for whom", icon: MapPin, required: ["location", "programs"] },
        { key: "case", label: "The case", icon: ClipboardList, required: ["gap"] },
        { key: "money", label: "Cost and funding", icon: Wallet, required: ["cost", "fund", "soleSource"] },
        { key: "site", label: "Site and safety", icon: ShieldCheck, required: [] as string[] },
        { key: "targets", label: "Targets", icon: Target, required: [] as string[] },
        { key: "when", label: "Timing", icon: CalendarDays, required: ["needBy"] },
        { key: "people", label: "People", icon: Users, required: ["requester", "manager"] },
    ];

    /* ───────────────────────── Form state ───────────────────────── */

    // The ask
    let title = $state("");
    let needType = $state("");
    let existingTool = $state("");
    let details = $state("");

    // Where and for whom
    let location = $state("");
    let programs: string[] = $state([]);
    let allocations: Record<string, { percent: string; customer: "" | "dod" | "commercial" }> = $state({});
    let splitTouched = false;

    // The case
    let gap = $state("");
    let alternatives: string[] = $state([]);
    let alternativesNote = $state("");
    let hoursPerWeek = $state(20);
    let usageTouched = $state(false);
    let successMeasure = $state("");

    // Cost and funding
    let purchase = $state("");
    let costs: Record<string, string> = $state({});
    let costConfidence = $state("rough_guess");
    let fundSource = $state("");
    let account = $state("");
    let vendor = $state("");
    let model = $state("");
    let soleSource = $state(false);
    let soleSourceReason = $state("");
    let files: File[] = $state([]);
    let dragging = $state(false);

    // Site and safety
    let utilities: string[] = $state([]);
    let utilityNote = $state("");
    let footprint = $state({ length: "", width: "", height: "" });
    let flags: Record<string, boolean> = $state(Object.fromEntries(flagDefs.map((f) => [f.key, false])));

    // Targets
    type Spec = { id: string; label: string; value: string; unit: string; priority: string };
    let specs: Spec[] = $state([]);
    let customSpec = $state("");

    // Timing
    const tz = getLocalTimeZone();
    const df = new DateFormatter("en-US", { dateStyle: "long" });
    let needBy: DateValue | undefined = $state();
    let dateOpen = $state(false);
    let firmness = $state("target");
    let path = $state("standard");
    let consequence = $state("");

    // People
    let typedName = $state("");
    let typedEmail = $state("");
    let manager = $state({ name: "", email: "" });
    type Person = { id: string; name: string; email: string; role: string };
    let stakeholders: Person[] = $state([{ id: generateID(), name: "", email: "", role: "equipment_owner" }]);

    // Flow
    let showErrors = $state(false);
    let submitting = $state(false);
    let submitted = $state(false);
    let savedAt: Date | null = $state(null);
    let active = $state("ask");

    /* ───────────────────────── Derived ───────────────────────── */

    const emailOk = (v: string) => /^\S+@\S+\.\S+$/.test(v);
    const cents = (v: string | undefined) => Math.round((parseFloat((v ?? "").replace(/[^0-9.]/g, "")) || 0) * 100);
    const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

    const requester = $derived({ name: user?.name ?? typedName, email: user?.email ?? typedEmail });
    const replacesTool = $derived(["replacement", "end_of_life", "recurring_failure"].includes(needType));
    const percentSum = $derived(programs.reduce((n, p) => n + (Number(allocations[p]?.percent) || 0), 0));
    const totalCents = $derived(cents(purchase) + Object.values(costs).reduce((n, v) => n + cents(v), 0));
    const hasExtraCosts = $derived(Object.values(costs).some((v) => cents(v) > 0));

    const errors = $derived.by(() => {
        const e: Record<string, string> = {};
        if (!title.trim()) e.title = "Give the equipment a short name.";
        if (!needType) e.needType = "Pick what best describes the need.";
        if (existingTool && !/^[A-Z]{3}\d{2}$/.test(existingTool)) e.existingTool = "Tool IDs look like ABL51.";
        if (!details.trim()) e.details = "Say what it will do and why it matters.";
        if (!location) e.location = "Choose a building.";
        if (!programs.length) e.programs = "Pick at least one program.";
        else if (programs.some((p) => !allocations[p]?.customer)) e.programs = "Choose DoD or Commercial for each program.";
        else if (programs.length > 1 && percentSum !== 100) e.programs = `Shares add up to ${percentSum}%. They need to total 100%.`;
        if (!gap.trim()) e.gap = "Describe what you can't do today.";
        if (cents(purchase) <= 0) e.cost = "Add at least a rough purchase price.";
        if (!fundSource) e.fund = "Pick a fund source.";
        if (soleSource && !soleSourceReason.trim()) e.soleSource = "Say why only this vendor will work.";
        if (!needBy) e.needBy = "Choose a target date.";
        if (!requester.name.trim() || !emailOk(requester.email)) e.requester = "Add your name and a valid email.";
        if (!manager.name.trim() || !emailOk(manager.email)) e.manager = "Your manager's endorsement is required to submit.";
        return e;
    });

    const isDone = (s: (typeof sectionMeta)[number]) => s.required.every((k) => !errors[k]);
    const requiredSections = sectionMeta.filter((s) => s.required.length);
    const doneCount = $derived(requiredSections.filter(isDone).length);
    const progressPct = $derived(Math.round((doneCount / requiredSections.length) * 100));
    const missingCount = $derived(Object.keys(errors).length);

    /* ───────────────────────── Actions ───────────────────────── */

    function go(key: string) {
        document.getElementById(`sec-${key}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function splitEvenly(list: string[] = programs) {
        const n = list.length;
        if (!n) return;
        const base = Math.floor(100 / n);
        list.forEach((p, i) => (allocations[p].percent = String(i === 0 ? 100 - base * (n - 1) : base)));
        splitTouched = false;
    }

    function setPrograms(next: string[]) {
        for (const p of next) allocations[p] ??= { percent: "", customer: "" };
        programs = next;
        if (!splitTouched) splitEvenly(next);
    }

    function addSpec(label: string, unit = "") {
        const name = label.trim();
        if (!name || specs.some((s) => s.label.toLowerCase() === name.toLowerCase())) return;
        specs = [...specs, { id: generateID(), label: name, value: "", unit, priority: "must" }];
    }

    function addCustomSpec() {
        addSpec(customSpec);
        customSpec = "";
    }

    function addPerson() {
        stakeholders = [...stakeholders, { id: generateID(), name: "", email: "", role: "operator" }];
    }

    function addFiles(list: FileList | null) {
        if (!list) return;
        const known = new Set(files.map((f) => `${f.name}:${f.size}`));
        files = [...files, ...Array.from(list).filter((f) => !known.has(`${f.name}:${f.size}`))];
    }

    const fileSize = (n: number) => (n > 1_048_576 ? `${(n / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
    const fileKind = (f: File) => (f.name.split(".").pop() ?? "file").toUpperCase();
    const roleLabel = (v: string) => roles.find((r) => r.value === v)?.label ?? "Choose a role";
    const dateLabel = (d: DateValue | undefined) => (d ? df.format(d.toDate(tz)) : "Pick a date");

    function setDatePreset(d: DateValue) {
        needBy = d;
        dateOpen = false;
    }

    function buildPayload() {
        const cost = (category: string, v: string | undefined) => ({ category, type: "estimate", amount_cents: cents(v) });
        return {
            title: title.trim(),
            need_type: needType,
            replaces_tool_code: replacesTool && existingTool ? existingTool : null,
            problem_statement: details.trim(),
            missing_capabilities: gap.trim(),
            alternatives_considered: { options: alternatives, note: alternativesNote.trim() },
            expected_hours_per_week: usageTouched ? hoursPerWeek : null,
            success_measure: successMeasure.trim(),
            location_id: location,
            program_allocations: programs.map((p) => ({
                program: p,
                percent: programs.length > 1 ? Number(allocations[p].percent) : 100,
                customer_type: allocations[p].customer,
            })),
            cost_lines: [cost("purchase", purchase), ...extraCosts.filter((c) => cents(costs[c.key]) > 0).map((c) => cost(c.key, costs[c.key]))],
            cost_confidence: costConfidence,
            fund_source: fundSource,
            proposed_account: account.trim() || null,
            preselected_quote: vendor.trim() ? { vendor: vendor.trim(), model: model.trim(), sole_source: soleSource, sole_source_reason: soleSourceReason.trim() } : null,
            utilities: { needs: utilities, note: utilityNote.trim() },
            footprint_m: footprint,
            risk_flags: Object.keys(flags).filter((k) => flags[k]),
            target_specs: specs.filter((s) => s.value.trim()).map(({ label, value, unit, priority }) => ({ label, value, unit, priority })),
            need_by_date: needBy?.toString(),
            deadline_firmness: firmness,
            path: path || "standard",
            consequence_if_missed: consequence.trim(),
            requester,
            manager,
            stakeholders: stakeholders.filter((s) => emailOk(s.email)).map(({ name, email, role }) => ({ name, email, role })),
            attachments: files.map((f) => f.name),
        };
    }

    function saveDraft() {
        // TODO: persist as a draft Request (no RequestVersion until submit).
        savedAt = new Date();
    }

    async function submitProposal() {
        showErrors = true;
        const firstIncomplete = sectionMeta.find((s) => !isDone(s));
        if (firstIncomplete) return go(firstIncomplete.key);
        submitting = true;
        try {
            await onsubmit?.(buildPayload());
            submitted = true;
        } finally {
            submitting = false;
        }
    }

    // Highlight the section currently in view in the side rail.
    $effect(() => {
        const io = new IntersectionObserver(
            (entries) => entries.forEach((e) => e.isIntersecting && (active = e.target.id.replace("sec-", ""))),
            { rootMargin: "-25% 0px -65% 0px" },
        );
        sectionMeta.forEach((s) => {
            const el = document.getElementById(`sec-${s.key}`);
            if (el) io.observe(el);
        });
        return () => io.disconnect();
    });

    const cardClass =
        "cursor-pointer flex flex-col items-start gap-1.5 border p-4 bg-accent/60 opacity-60 hover:opacity-100 transition-all " +
        "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring " +
        "data-[selected=true]:bg-background data-[selected=true]:shadow-md data-[selected=true]:opacity-100 data-[selected=true]:border-foreground/30";
    const chipClass = "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary";
</script>


<Tabs.Root value='proposal'>
<Tabs.Content value="proposal" class="grid w-full max-w-7xl mx-auto grid-cols-1 gap-x-16 px-[5vw] md:grid-cols-[minmax(15rem,20rem)_minmax(0,1fr)]">
    <!-- Rail: progress, section outline, live snapshot -->
    <aside>
        <div class="space-y-6 pt-20 md:sticky md:top-0 md:pt-28">
            <div class="flex items-center gap-3">
                <img src="/brand/icon.svg" class="size-10" alt="TxIE logo" />
                <h1 class="text-2xl font-medium">01 - Proposal</h1>
            </div>

            <div class="space-y-2">
                <div class="flex items-baseline justify-between text-sm">
                    <span class="font-medium">{doneCount} of {requiredSections.length} required sections</span>
                    <span class="text-muted-foreground tabular-nums">{progressPct}%</span>
                </div>
                <Progress value={progressPct} max={100} class="h-1" />
            </div>

            <nav aria-label="Proposal sections" class="hidden md:block">
                <ol class="space-y-0.5">
                    {#each sectionMeta as s (s.key)}
                        <li>
                            <button
                                type="button"
                                onclick={() => go(s.key)}
                                aria-current={active === s.key ? "step" : undefined}
                                class={["flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent", active === s.key ? "bg-accent font-medium" : "text-muted-foreground"]}>
                                {#if s.required.length && isDone(s)}
                                    <CircleCheck class="size-4 text-emerald-600" />
                                {:else}
                                    <Circle class={["size-4", !s.required.length && "opacity-40"]} />
                                {/if}
                                {s.label}
                                {#if !s.required.length}<span class="ml-auto text-xs">optional</span>{/if}
                            </button>
                        </li>
                    {/each}
                </ol>
            </nav>

            <dl class="hidden grid-cols-2 gap-y-3 border-t pt-4 text-sm md:grid">
                <dt class="text-muted-foreground">Estimated cost</dt>
                <dd class="text-right font-medium tabular-nums">{totalCents ? usd.format(totalCents / 100) : "Not set"}</dd>
                <dt class="text-muted-foreground">Needed by</dt>
                <dd class="text-right font-medium">{needBy ? df.format(needBy.toDate(tz)) : "Not set"}</dd>
                <dt class="text-muted-foreground">Location</dt>
                <dd class="text-right font-medium uppercase">{location || "Not set"}</dd>
                <dt class="text-muted-foreground">Programs</dt>
                <dd class="text-right font-medium">{programs.length ? programs.join(", ") : "Not set"}</dd>
            </dl>
        </div>
    </aside>

    <article class="max-w-2xl pb-36 md:pt-28">
        <!-- 1 · The ask -->
        <section id="sec-ask" class="scroll-mt-24 space-y-6 pb-12">
            {@render Head(Lightbulb, "What do you need?", "Start with the name and the kind of need.")}

            <Field.Field data-invalid={showErrors && !!errors.title}>
                <Field.Label for="title">Equipment name</Field.Label>
                <Input id="title" bind:value={title} maxlength={80} placeholder="Wafer-based plasma dicer" aria-invalid={showErrors && !!errors.title} />
                {@render Err("title")}
            </Field.Field>

            <Field.Set>
                <Field.Legend variant="label">What kind of need is it?</Field.Legend>
                <RadioGroup.Root bind:value={needType} class="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {#each needTypes as n (n.value)}
                        {@render Choice(n.value, needType, n.label, n.hint, n.icon)}
                    {/each}
                </RadioGroup.Root>
                {@render Err("needType")}
            </Field.Set>

            {#if replacesTool}
                <div transition:slide>
                    <Field.Field data-invalid={showErrors && !!errors.existingTool}>
                        <Field.Label for="existing-tool">Which tool does it replace?</Field.Label>
                        <Input
                            id="existing-tool"
                            value={existingTool}
                            oninput={(e) => (existingTool = e.currentTarget.value.toUpperCase().replace(/\s/g, ""))}
                            placeholder="ABL51"
                            class="max-w-40 font-mono"
                            aria-invalid={showErrors && !!errors.existingTool} />
                        <Field.Description>Optional. Use the tool ID if you know it.</Field.Description>
                        {@render Err("existingTool")}
                    </Field.Field>
                </div>
            {/if}

            <Field.Field data-invalid={showErrors && !!errors.details}>
                <Field.Label for="details">What will it do, and why do we need it?</Field.Label>
                <InputGroup.Root>
                    <InputGroup.Textarea
                        id="details"
                        bind:value={details}
                        maxlength={300}
                        class="min-h-24 resize-none"
                        placeholder={"Supports C4 bumping when pitch is 200 µm or more.\nSeveral customers are asking for 4 to 16 mil spheres, SnPb and SnAg."} />
                    {@render Count(details, 300)}
                </InputGroup.Root>
                {@render Err("details")}
            </Field.Field>
        </section>

        <!-- 2 · Where and for whom -->
        <section id="sec-where" class="scroll-mt-24 space-y-6 border-t py-12">
            {@render Head(MapPin, "Where will it live, and who is it for?", "This decides who reviews the facility side and which budget it hits.")}

            <Field.Set>
                <Field.Legend variant="label">Building</Field.Legend>
                <RadioGroup.Root bind:value={location} class="grid grid-cols-2 gap-3">
                    {#each locations as l (l.value)}
                        {@render Choice(l.value, location, l.label, l.code, l.icon)}
                    {/each}
                </RadioGroup.Root>
                {@render Err("location")}
            </Field.Set>

            <Field.Set>
                <Field.Legend variant="label">Programs it supports</Field.Legend>
                <Field.Description>Pick every program that will use it.</Field.Description>
                <ToggleGroup.Root type="multiple" variant="outline" size="sm" spacing={2} bind:value={() => programs, setPrograms} class="w-full flex-col items-start gap-4">
                    {#each programGroups as g (g.label)}
                        <div class="flex flex-wrap items-center gap-2">
                            <span class="w-28 text-sm text-muted-foreground">{g.label}</span>
                            {#each g.items as p (p)}
                                <ToggleGroup.Item value={p} class={chipClass}>{p}</ToggleGroup.Item>
                            {/each}
                        </div>
                    {/each}
                </ToggleGroup.Root>

                {#if programs.length}
                    <div class="mt-2 space-y-2" transition:slide>
                        {#each programs as p (p)}
                            <div class="flex flex-wrap items-center gap-3 border bg-accent/40 p-3">
                                <strong class="w-16">{p}</strong>
                                {#if programs.length > 1}
                                    <InputGroup.Root class="w-28 bg-background">
                                        <InputGroup.Input
                                            type="number"
                                            min="0"
                                            max="100"
                                            inputmode="numeric"
                                            aria-label="{p} share of use"
                                            bind:value={allocations[p].percent}
                                            oninput={() => (splitTouched = true)} />
                                        <InputGroup.Addon align="inline-end"><InputGroup.Text>%</InputGroup.Text></InputGroup.Addon>
                                    </InputGroup.Root>
                                {/if}
                                <ToggleGroup.Root type="single" variant="outline" size="sm" bind:value={allocations[p].customer} class="ml-auto" aria-label="{p} customer type">
                                    <ToggleGroup.Item value="dod" class={chipClass}>DoD</ToggleGroup.Item>
                                    <ToggleGroup.Item value="commercial" class={chipClass}>Commercial</ToggleGroup.Item>
                                </ToggleGroup.Root>
                            </div>
                        {/each}
                        {#if programs.length > 1}
                            <div class="flex items-center justify-between text-sm">
                                <span class={percentSum === 100 ? "text-muted-foreground" : "text-destructive"}>Shares total {percentSum}%</span>
                                <Button variant="ghost" size="sm" onclick={() => splitEvenly()}>Split evenly</Button>
                            </div>
                        {/if}
                    </div>
                {/if}
                {@render Err("programs")}
            </Field.Set>
        </section>

        <!-- 3 · The case -->
        <section id="sec-case" class="scroll-mt-24 space-y-6 border-t py-12">
            {@render Head(ClipboardList, "Make the case", "A few taps and two short answers. Leadership decides on this section.")}

            <Field.Field data-invalid={showErrors && !!errors.gap}>
                <Field.Label for="gap">What can't you do today that this fixes?</Field.Label>
                <InputGroup.Root>
                    <InputGroup.Textarea
                        id="gap"
                        bind:value={gap}
                        maxlength={200}
                        class="min-h-20 resize-none"
                        placeholder="Bumping is manual, slow, and error-prone. This automates it and raises throughput." />
                    {@render Count(gap, 200)}
                </InputGroup.Root>
                {@render Err("gap")}
            </Field.Field>

            <Field.Set>
                <Field.Legend variant="label">What else did you consider?</Field.Legend>
                <Field.Description>Select any that you looked at.</Field.Description>
                <ToggleGroup.Root type="multiple" variant="outline" size="sm" spacing={2} bind:value={alternatives} class="flex-wrap">
                    {#each alternativeOptions as a (a.value)}
                        <ToggleGroup.Item value={a.value} class={chipClass}>{a.label}</ToggleGroup.Item>
                    {/each}
                </ToggleGroup.Root>
                {#if alternatives.length}
                    <div transition:slide>
                        <Input bind:value={alternativesNote} maxlength={140} aria-label="Why those didn't work" placeholder="Why didn't that work? One line is enough." />
                    </div>
                {/if}
            </Field.Set>

            <Field.Field>
                <Field.Label for="hours">
                    How much will it run?
                    <span class="ml-auto font-normal text-muted-foreground tabular-nums">{usageTouched ? `About ${hoursPerWeek} hours a week` : "Drag to set"}</span>
                </Field.Label>
                <Slider id="hours" type="single" bind:value={hoursPerWeek} min={0} max={168} step={2} onValueChange={() => (usageTouched = true)} class="mt-2 w-full" aria-label="Hours per week" />
            </Field.Field>

            <Field.Field>
                <Field.Label for="success">How will we know it worked?</Field.Label>
                <Input id="success" bind:value={successMeasure} maxlength={140} placeholder="Bump 300 mm wafers at 200 µm pitch with under 1% defects" />
                <Field.Description>This becomes the acceptance test later.</Field.Description>
            </Field.Field>
        </section>

        <!-- 4 · Cost and funding -->
        <section id="sec-money" class="scroll-mt-24 space-y-6 border-t py-12">
            {@render Head(Wallet, "What will it cost, and who pays?", "A rough number is fine. Real quotes come after approval.")}

            <Field.Field data-invalid={showErrors && !!errors.cost}>
                <Field.Label for="purchase">Purchase price</Field.Label>
                <InputGroup.Root>
                    <InputGroup.Addon><InputGroup.Text>$</InputGroup.Text></InputGroup.Addon>
                    <InputGroup.Input id="purchase" bind:value={purchase} inputmode="decimal" placeholder="280,000" aria-invalid={showErrors && !!errors.cost} />
                    <InputGroup.Addon align="inline-end"><InputGroup.Text>USD</InputGroup.Text></InputGroup.Addon>
                </InputGroup.Root>
                {@render Err("cost")}
            </Field.Field>

            <Collapsible.Root open={hasExtraCosts} class="space-y-3">
                <Collapsible.Trigger>
                    {#snippet child({ props })}
                        <Button {...props} variant="ghost" size="sm" class="-ml-2 gap-2 text-muted-foreground">
                            <ChevronDown class="size-4" /> Add shipping, install, fit-up, and other costs
                        </Button>
                    {/snippet}
                </Collapsible.Trigger>
                <Collapsible.Content>
                    <div class="grid gap-3 sm:grid-cols-2">
                        {#each extraCosts as c (c.key)}
                            <InputGroup.Root>
                                <InputGroup.Addon align="block-start">
                                    <Label for="cost-{c.key}" class="text-muted-foreground"><c.icon class="size-4" /> {c.label}</Label>
                                </InputGroup.Addon>
                                <InputGroup.Addon><InputGroup.Text>$</InputGroup.Text></InputGroup.Addon>
                                <InputGroup.Input id="cost-{c.key}" inputmode="decimal" placeholder="0" bind:value={costs[c.key]} />
                            </InputGroup.Root>
                        {/each}
                    </div>
                </Collapsible.Content>
            </Collapsible.Root>

            <div class="flex flex-wrap items-center justify-between gap-3 border bg-accent/40 p-4">
                <div>
                    <p class="text-sm text-muted-foreground">Estimated total</p>
                    <p class="text-2xl font-medium tabular-nums">{usd.format(totalCents / 100)}</p>
                </div>
                <ToggleGroup.Root type="single" variant="outline" size="sm" bind:value={costConfidence} aria-label="How confident is this estimate">
                    {#each confidenceOptions as c (c.value)}
                        <ToggleGroup.Item value={c.value} class={chipClass}>{c.label}</ToggleGroup.Item>
                    {/each}
                </ToggleGroup.Root>
            </div>

            <Field.Set>
                <Field.Legend variant="label">Where does the money come from?</Field.Legend>
                <ToggleGroup.Root type="single" variant="outline" size="sm" spacing={2} bind:value={fundSource} class="flex-wrap">
                    {#each fundSources as f (f.value)}
                        <ToggleGroup.Item value={f.value} class={chipClass}><Landmark class="size-4" /> {f.label}</ToggleGroup.Item>
                    {/each}
                </ToggleGroup.Root>
                {@render Err("fund")}
                {#if fundSource && fundSource !== "unsure"}
                    <div transition:slide>
                        <Input bind:value={account} aria-label="Account number" placeholder="Account number, if you have it" class="max-w-xs" />
                    </div>
                {/if}
            </Field.Set>

            <Field.Set>
                <Field.Legend variant="label">Have a vendor in mind?</Field.Legend>
                <Field.Description>Optional. We'll gather at least three quotes after approval unless only one vendor can do it.</Field.Description>
                <div class="grid gap-3 sm:grid-cols-2">
                    <Input bind:value={vendor} aria-label="Vendor" placeholder="Keysight Technologies" />
                    <Input bind:value={model} aria-label="Model" placeholder="4080 Tester" />
                </div>
                {#if vendor.trim()}
                    <div class="space-y-3" transition:slide>
                        <Field.Field orientation="horizontal">
                            <Switch id="sole-source" bind:checked={soleSource} />
                            <Field.Label for="sole-source" class="font-normal">Only this vendor can meet the need</Field.Label>
                        </Field.Field>
                        {#if soleSource}
                            <Field.Field data-invalid={showErrors && !!errors.soleSource}>
                                <Input bind:value={soleSourceReason} maxlength={140} aria-label="Why only this vendor" placeholder="Why only them? One line." />
                                {@render Err("soleSource")}
                            </Field.Field>
                        {/if}
                    </div>
                {/if}
            </Field.Set>

            <Field.Set>
                <Field.Legend variant="label">Quotes, datasheets, or emails</Field.Legend>
                <label
                    class={["flex cursor-pointer flex-col items-center gap-1.5 border border-dashed p-6 text-center text-sm transition-colors hover:bg-accent/50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring", dragging && "bg-accent"]}
                    ondragover={(e) => { e.preventDefault(); dragging = true; }}
                    ondragleave={() => (dragging = false)}
                    ondrop={(e) => { e.preventDefault(); dragging = false; addFiles(e.dataTransfer?.files ?? null); }}>
                    <Upload class="size-5 stroke-[1.5]" />
                    <span class="font-medium">Drop files here</span>
                    <span class="text-muted-foreground">or click to browse</span>
                    <input type="file" multiple class="sr-only" onchange={(e) => { addFiles(e.currentTarget.files); e.currentTarget.value = ""; }} />
                </label>
                {#if files.length}
                    <div class="flex flex-col gap-2">
                        {#each files as f, i (f.name + f.size + f.lastModified)}
                            <Attachment.Root state="idle" size="sm" class="w-full">
                                <Attachment.Media><FileText /></Attachment.Media>
                                <Attachment.Content>
                                    <Attachment.Title>{f.name}</Attachment.Title>
                                    <Attachment.Description>{fileKind(f)} {fileSize(f.size)}</Attachment.Description>
                                </Attachment.Content>
                                <Attachment.Actions>
                                    <Attachment.Action aria-label="Remove {f.name}" onclick={() => (files = files.filter((_, j) => j !== i))}><X /></Attachment.Action>
                                </Attachment.Actions>
                            </Attachment.Root>
                        {/each}
                    </div>
                {/if}
            </Field.Set>
        </section>

        <!-- 5 · Site and safety -->
        <section id="sec-site" class="scroll-mt-24 space-y-6 border-t py-12">
            {@render Head(ShieldCheck, "What does the site need to provide?", "Facilities and EHS start planning from this.", true)}

            <Field.Set>
                <Field.Legend variant="label">It will need</Field.Legend>
                <ToggleGroup.Root type="multiple" variant="outline" size="sm" spacing={2} bind:value={utilities} class="flex-wrap">
                    {#each utilityOptions as u (u.value)}
                        <ToggleGroup.Item value={u.value} class={chipClass}><u.icon class="size-4" /> {u.label}</ToggleGroup.Item>
                    {/each}
                </ToggleGroup.Root>
                {#if utilities.length}
                    <div transition:slide>
                        <Input bind:value={utilityNote} maxlength={140} aria-label="Utility details" placeholder="Specifics, e.g. 208 V 3-phase, 40 A, N2 and CDA" />
                    </div>
                {/if}
            </Field.Set>

            <Field.Set>
                <Field.Legend variant="label">Footprint</Field.Legend>
                <div class="grid grid-cols-3 gap-3">
                    {#each [["length", "Length", "1.2"], ["width", "Width", "2.0"], ["height", "Height", "1.5"]] as [k, label, ph] (k)}
                        <InputGroup.Root>
                            <InputGroup.Addon align="block-start"><Label for="fp-{k}" class="text-muted-foreground">{label}</Label></InputGroup.Addon>
                            <InputGroup.Input id="fp-{k}" inputmode="decimal" placeholder={ph} bind:value={footprint[k as "length" | "width" | "height"]} />
                            <InputGroup.Addon align="inline-end"><InputGroup.Text>m</InputGroup.Text></InputGroup.Addon>
                        </InputGroup.Root>
                    {/each}
                </div>
            </Field.Set>

            <Field.Set>
                <Field.Legend variant="label">Anything leadership should know?</Field.Legend>
                <Field.Group class="gap-3">
                    {#each flagDefs as f (f.key)}
                        <Field.Label for="flag-{f.key}">
                            <Field.Field orientation="horizontal">
                                <Field.Content>
                                    <Field.Title><f.icon class="size-4" /> {f.label}</Field.Title>
                                    <Field.Description>{f.hint}</Field.Description>
                                </Field.Content>
                                <Switch id="flag-{f.key}" bind:checked={flags[f.key]} />
                            </Field.Field>
                        </Field.Label>
                    {/each}
                </Field.Group>
            </Field.Set>
        </section>

        <!-- 6 · Targets -->
        <section id="sec-targets" class="scroll-mt-24 space-y-6 border-t py-12">
            {@render Head(Target, "What must it be able to do?", "Add only the numbers you're sure about. Vendors are scored against these.", true)}

            <div class="flex flex-wrap gap-2">
                {#each specPresets as p (p.label)}
                    <Button variant="outline" size="sm" class="gap-1.5" disabled={specs.some((s) => s.label === p.label)} onclick={() => addSpec(p.label, p.unit)}>
                        <Plus class="size-3.5" /> {p.label}
                    </Button>
                {/each}
            </div>

            {#if specs.length}
                <div class="space-y-2">
                    {#each specs as s (s.id)}
                        <div class="grid grid-cols-[1fr_auto] items-center gap-2 border p-3 sm:grid-cols-[8rem_1fr_6rem_auto_auto]" transition:slide>
                            <strong class="col-span-2 sm:col-span-1">{s.label}</strong>
                            <Input bind:value={s.value} aria-label="{s.label} target" placeholder="Target value" />
                            <Input bind:value={s.unit} aria-label="{s.label} unit" placeholder="Unit" />
                            <ToggleGroup.Root type="single" variant="outline" size="sm" bind:value={s.priority} aria-label="{s.label} priority">
                                <ToggleGroup.Item value="must" class={chipClass}>Must</ToggleGroup.Item>
                                <ToggleGroup.Item value="nice" class={chipClass}>Nice</ToggleGroup.Item>
                            </ToggleGroup.Root>
                            <Button size="icon" variant="ghost" aria-label="Remove {s.label}" onclick={() => (specs = specs.filter((x) => x.id !== s.id))}>
                                <Trash class="size-4" />
                            </Button>
                        </div>
                    {/each}
                </div>
            {/if}

            <InputGroup.Root class="max-w-sm">
                <InputGroup.Input
                    bind:value={customSpec}
                    aria-label="Add your own target"
                    placeholder="Add your own, e.g. Chuck flatness"
                    onkeydown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomSpec())} />
                <InputGroup.Addon align="inline-end">
                    <InputGroup.Button size="icon-xs" aria-label="Add target" disabled={!customSpec.trim()} onclick={addCustomSpec}><Plus /></InputGroup.Button>
                </InputGroup.Addon>
            </InputGroup.Root>
        </section>

        <!-- 7 · Timing -->
        <section id="sec-when" class="scroll-mt-24 space-y-6 border-t py-12">
            {@render Head(CalendarDays, "When do you need it running?", "An approximate date is fine.")}

            <Field.Field data-invalid={showErrors && !!errors.needBy}>
                <Field.Label for="need-by">Installed and operational by</Field.Label>
                <div class="flex flex-wrap items-center gap-2">
                    <!-- <Popover.Root bind:open={dateOpen}>
                        <Popover.Trigger id="need-by">
                            {#snippet child({ props })}
                                <Button {...props} variant="outline" class={["min-w-52 justify-start font-normal", !needBy && "text-muted-foreground"]}>
                                    <CalendarDays class="size-4" /> {dateLabel(needBy)}
                                </Button>
                            {/snippet}
                        </Popover.Trigger>
                        <Popover.Content class="w-auto overflow-hidden p-0" align="start">
                            <Calendar type="single" bind:value={needBy} captionLayout="dropdown" minValue={today(tz)} onValueChange={() => (dateOpen = false)} />
                        </Popover.Content>
                    </Popover.Root> -->
                    <DatePicker bind:value={needBy} />
                    <Button variant="ghost" size="sm" onclick={() => setDatePreset(today(tz).add({ months: 3 }))}>In 3 months</Button>
                    <Button variant="ghost" size="sm" onclick={() => setDatePreset(today(tz).add({ months: 6 }))}>In 6 months</Button>
                    <Button variant="ghost" size="sm" onclick={() => setDatePreset(new CalendarDate(today(tz).year, 12, 31))}>End of year</Button>
                </div>
                {@render Err("needBy")}
            </Field.Field>

            <Field.Set>
                <Field.Legend variant="label">How firm is that date?</Field.Legend>
                <ToggleGroup.Root type="single" variant="outline" size="sm" spacing={2} bind:value={firmness}>
                    <ToggleGroup.Item value="hard" class={chipClass}>Hard deadline</ToggleGroup.Item>
                    <ToggleGroup.Item value="target" class={chipClass}>Target</ToggleGroup.Item>
                    <ToggleGroup.Item value="flexible" class={chipClass}>Flexible</ToggleGroup.Item>
                </ToggleGroup.Root>
            </Field.Set>

            <Field.Field>
                <Field.Label for="consequence">What happens if it's late?</Field.Label>
                <Input id="consequence" bind:value={consequence} maxlength={140} placeholder="We miss the July milestones for the new product line." />
            </Field.Field>

            <Field.Set>
                <Field.Legend variant="label">Is something forcing the timeline?</Field.Legend>
                <ToggleGroup.Root type="single" variant="outline" size="sm" spacing={2} bind:value={path}>
                    <ToggleGroup.Item value="standard" class={chipClass}>No</ToggleGroup.Item>
                    <ToggleGroup.Item value="expedited" class={chipClass}>Time-limited offer</ToggleGroup.Item>
                    <ToggleGroup.Item value="emergency" class={chipClass}>A tool is down</ToggleGroup.Item>
                </ToggleGroup.Root>
            </Field.Set>
        </section>

        <!-- 8 · People -->
        <section id="sec-people" class="scroll-mt-24 space-y-6 border-t py-12">
            {@render Head(Users, "Who's involved?", "Your manager endorses this before it goes to leadership.")}

            <Field.Set data-invalid={showErrors && !!errors.requester}>
                <Field.Legend variant="label">You</Field.Legend>
                {#if user}
                    <div class="flex items-center gap-3 border bg-accent/40 p-3">
                        <UserRound class="size-5 stroke-[1.5]" />
                        <div class="text-sm"><p class="font-medium">{user.name}</p><p class="text-muted-foreground">{user.email}</p></div>
                    </div>
                {:else}
                    <div class="grid gap-3 sm:grid-cols-2">
                        <Input bind:value={typedName} autocomplete="name" aria-label="Your name" placeholder="Leonel Aranda" />
                        <Input bind:value={typedEmail} type="email" autocomplete="email" aria-label="Your email" placeholder="leonel_aranda@txie.org" />
                    </div>
                {/if}
                {@render Err("requester")}
            </Field.Set>

            <Field.Set data-invalid={showErrors && !!errors.manager}>
                <Field.Legend variant="label">Your manager</Field.Legend>
                <div class="grid gap-3 sm:grid-cols-2">
                    <Input bind:value={manager.name} aria-label="Manager name" placeholder="Barbara Groh" />
                    <Input bind:value={manager.email} type="email" aria-label="Manager email" placeholder="barbara_groh@txie.org" />
                </div>
                {@render Err("manager")}
            </Field.Set>

            <Field.Set>
                <Field.Legend variant="label">Who will own, run, and maintain it?</Field.Legend>
                <div class="space-y-2">
                    {#each stakeholders as s (s.id)}
                        <div class="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[1fr_1fr_11rem_auto]" transition:slide>
                            <Input bind:value={s.name} autocomplete="off" aria-label="Name" placeholder="Name" />
                            <Input bind:value={s.email} type="email" autocomplete="off" aria-label="Email" placeholder="Email" />
                            <Select.Root type="single" bind:value={s.role}>
                                <Select.Trigger class="w-full" aria-label="Role">{roleLabel(s.role)}</Select.Trigger>
                                <Select.Content>
                                    {#each roles as r (r.value)}<Select.Item value={r.value} label={r.label} />{/each}
                                </Select.Content>
                            </Select.Root>
                            <Button size="icon" variant="ghost" aria-label="Remove person" onclick={() => (stakeholders = stakeholders.filter((x) => x.id !== s.id))}>
                                <Trash class="size-4" />
                            </Button>
                        </div>
                    {/each}
                </div>
                <Button size="sm" variant="outline" class="w-max gap-2" onclick={addPerson}><UserRoundPlus class="size-4" /> Add person</Button>
            </Field.Set>
        </section>

        <!-- Submit -->
        <div class="space-y-3 border-t pt-8">
            {#if submitted}
                <p class="flex items-center gap-2 font-medium" transition:slide><CircleCheck class="size-5 text-emerald-600" /> Sent to FAB Leadership.</p>
            {:else}
                <div class="flex flex-wrap items-center gap-3">
                    <Button onclick={submitProposal} disabled={submitting} class="gap-3">
                        Forward to FAB Leadership <ArrowRight class="size-4 stroke-[1.5]" />
                    </Button>
                    <Button variant="outline" onclick={saveDraft} class="gap-2"><Save class="size-4" /> Save draft</Button>
                </div>
                <p class="text-sm text-muted-foreground" aria-live="polite">
                    {#if showErrors && missingCount}
                        {missingCount} required {missingCount === 1 ? "item needs" : "items need"} attention. Sections marked in the outline show where.
                    {:else if savedAt}
                        Draft saved at {savedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}.
                    {:else}
                        Only what's marked required is needed to submit.
                    {/if}
                </p>
            {/if}
        </div>
    </article>
</Tabs.Content>
</Tabs.Root>

{#snippet Head(Icon: Component, heading: string, hint: string, optional = false)}
    <header class="flex items-start gap-3">
        <span class="grid size-9 shrink-0 place-items-center rounded-md bg-accent"><Icon class="size-5 stroke-[1.5]" /></span>
        <div>
            <h3 class="text-lg font-medium leading-tight">
                {heading}
                {#if optional}<Badge variant="secondary" class="ml-2 align-middle">Optional</Badge>{/if}
            </h3>
            <p class="text-muted-foreground">{hint}</p>
        </div>
    </header>
{/snippet}

{#snippet Choice(value: string, current: string, label: string, hint: string, Icon: Component)}
    <Label class={cardClass} data-selected={value === current}>
        <RadioGroup.Item class="sr-only" {value} />
        <Icon class="size-5 stroke-[1.5]" />
        <span class="mt-1 font-medium">{label}</span>
        <span class="text-sm font-normal text-muted-foreground">{hint}</span>
    </Label>
{/snippet}

{#snippet Count(value: string, max: number)}
    <InputGroup.Addon align="block-end">
        <InputGroup.Text class="ms-auto text-xs tabular-nums">{max - value.length} left</InputGroup.Text>
    </InputGroup.Addon>
{/snippet}

{#snippet Err(key: string)}
    {#if showErrors && errors[key]}
        <Field.Error>{errors[key]}</Field.Error>
    {/if}
{/snippet}