<script lang='ts'>
    import { onDestroy } from 'svelte';
    import Proposal from './proposal.svelte';
    import Sourcing from './sourcing.svelte';
    import Leadership from './leadership.svelte';
    import Summary from './summary.svelte';
    import type { PageData } from './$types';
    import * as Tabs from '$lib/components/tabs';
    import * as NativeSelect from '$lib/components/native-select';
    import { database } from '$lib/data/smartsheet.svelte';
    import { stageOf, versionOf } from '$lib/data/snapshot-fields';
    import type { Stage } from '$lib/models/procurement';

    let { data }: { data: PageData } = $props();

    let tab = $state('proposal');
    let previousTab = $state('proposal');

    // Save only when leaving a request workflow tab, not on every field edit.
    $effect(() => {
        if (tab === previousTab) return;
        previousTab = tab;
        void database.save().catch((error) => console.error('Failed to save before changing request tab', error));
    });

    // SvelteKit destroys this page when leaving the request entirely. keepalive lets the request
    // continue while the browser navigates away.
    onDestroy(() => {
        void database.save({ keepalive: true }).catch((error) => console.error('Failed to save before leaving request', error));
    });

    // Every draft of this request; the latest is the one being worked on
    const versions = $derived(database.versions(data.requestID));
    let selectedId: string | null = $state(null);
    const latest = $derived(versions.at(-1)!);
    const snapshot = $derived(versions.find((v) => v.id === selectedId) ?? latest);

    const stageLabel: Record<Stage, string> = {
        draft: 'Draft',
        fab_leadership_review: 'In review',
        changes_requested: 'Changes requested',
        approved: 'Approved',
        rejected: 'Rejected'
    };

    /** Leadership asked for changes: jump to the new draft so it can be edited. */
    function openDraft(id: string) {
        selectedId = id;
        tab = 'proposal';
    }

    const sections = [
        { value: 'proposal', label: 'Proposal' },
        { value: 'sourcing', label: 'Sourcing' },
        { value: 'leadership', label: 'Leadership' },
        { value: 'summary', label: 'Summary' }
    ];

    /** The latest draft and its vendors went to FAB Leadership: show it there. */
    function openReview() {
        selectedId = null;
        tab = 'leadership';
    }
</script>

<Tabs.Root bind:value={tab} class="txie-theme min-h-screen bg-txie-canvas text-txie-ink">
    {#key snapshot.id}
        <Proposal {snapshot} onnext={() => (tab = 'sourcing')} />
        <Leadership {snapshot} onrevise={openDraft} />
    {/key}
    <!-- Vendors aren't versioned, so sourcing always works against the latest draft -->
    <Sourcing snapshot={latest} onforward={openReview} />
    <Summary {versions} />

    <!-- Fixed footer bar, under the app navbar (z-50) and overlays. The sections' own bottom padding (pb-20+) keeps content clear of it -->
    <nav aria-label='Request sections' class='fixed inset-x-0 bottom-0 z-40 grid grid-cols-[auto_auto] justify-between items-center pb-10 pt-4 px-[5vw] bg-linear-to-b from-transparent via-background to-background'>
        <Tabs.List class='h-8 gap-1 bg-transparent p-0'>
            {#each sections as { value, label } (value)}
                <Tabs.Trigger {value} aria-current={tab === value ? 'step' : undefined}
                    class='h-8 shadow-none! bg-transparent! border-0 px-3 text-txie-secondary hover:text-txie-ink data-active:text-brand-500 data-active:hover:text-brand-500 focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-txie-ink'>
                    {label}
                </Tabs.Trigger>
            {/each}
        </Tabs.List>

        {#if versions.length > 1}
            <NativeSelect.Root
                value={snapshot.id}
                onchange={({ currentTarget }) => (selectedId = currentTarget.value)}
                aria-label='Draft version'
                size='sm'
            >
                {#each versions as version (version.id)}
                    <NativeSelect.Option value={version.id}>
                        Draft {versionOf(version)} · {stageLabel[stageOf(version)]}
                    </NativeSelect.Option>
                {/each}
            </NativeSelect.Root>
        {/if}
    </nav>
</Tabs.Root>
