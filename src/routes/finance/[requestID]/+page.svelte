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

    /** The latest draft and its vendors went to FAB Leadership: show it there. */
    function openReview() {
        selectedId = null;
        tab = 'leadership';
    }
</script>

<Tabs.Root bind:value={tab}>
    {#key snapshot.id}
        <Proposal {snapshot} onnext={() => (tab = 'sourcing')} />
        <Leadership {snapshot} onrevise={openDraft} />
    {/key}
    <!-- Vendors aren't versioned, so sourcing always works against the latest draft -->
    <Sourcing snapshot={latest} onforward={openReview} />
    <Summary {versions} />

    <div class='fixed top-0 w-screen pb-5 pt-3 px-6 grid grid-cols-[1fr_auto_1fr] items-center pointer-events-none z-20 bg-linear-to-b from-background via-background to-transparent'>
        <span></span>
        <Tabs.List variant='line' class='gap-x-4 pointer-events-auto'>
            <Tabs.Trigger value='proposal' class='after:bg-transparent'>Proposal</Tabs.Trigger>
            <Tabs.Trigger value='sourcing' class='after:bg-transparent'>Sourcing</Tabs.Trigger>
            <Tabs.Trigger value='leadership' class='after:bg-transparent font-base'>Leadership</Tabs.Trigger>
            <Tabs.Trigger value='summary' class='after:bg-transparent'>Summary</Tabs.Trigger>
        </Tabs.List>

        {#if versions.length > 1}
            <NativeSelect.Root
                value={snapshot.id}
                onchange={(e) => (selectedId = e.currentTarget.value)}
                aria-label='Draft version'
                class='ml-auto w-max pointer-events-auto'
            >
                {#each versions as version (version.id)}
                    <NativeSelect.Option value={version.id}>
                        Draft {versionOf(version)} · {stageLabel[stageOf(version)]}
                    </NativeSelect.Option>
                {/each}
            </NativeSelect.Root>
        {/if}
    </div>
</Tabs.Root>
