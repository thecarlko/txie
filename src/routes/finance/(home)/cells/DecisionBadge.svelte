<script lang='ts' module>
    import type { BadgeVariant } from '$lib/components/badge';
    import type { Stage } from '$lib/models/procurement';

    const badges: Record<Stage, { label: string; variant: BadgeVariant; class?: string }> = {
        draft:                 { label: 'Draft',             variant: 'outline' },
        fab_leadership_review: { label: 'Leadership Review', variant: 'secondary' },
        changes_requested:     { label: 'Changes Requested', variant: 'outline',     class: 'border-orange-300 text-orange-700 dark:text-orange-300' },
        rejected:              { label: 'Rejected',          variant: 'destructive' },
        approved:              { label: 'Approved',          variant: 'default', class: 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300' }
    };
</script>

<script lang='ts'>
    import { Badge } from '$lib/components/badge';

    let { stage }: { stage: Stage } = $props();
    const badge = $derived(badges[stage]);
</script>

<Badge variant={badge.variant} class={badge.class}>{ badge.label }</Badge>
