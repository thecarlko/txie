<script lang='ts'>
    import { bank } from '$lib/data/bank.svelte';
    import { VisSingleContainer, VisSankey } from '@unovis/svelte'

    // bank amounts are cents; the diagram shows dollars
    let data = $derived({
        nodes: [
            { id: 'federal', color: "oklch(83.3% 0.145 321.434)", label: 'Federal' },
            { id: 'state', color: "oklch(78.5% 0.115 274.713)", label: 'State' },
            { id: 'private', color: "oklch(82.8% 0.111 230.318)", label: 'Private' },

            { id: 'account', color: "oklch(70.7% 0.022 261.325)", label: 'Account' },

            { id: 'approved', color: "oklch(64.6% 0.222 41.116)", label: 'FAB Approved' },
            { id: 'requested', color: "oklch(85.2% 0.199 91.936)", label: 'Requested' },
        ],
        links: [
            { source: 'federal', target: 'account', value: bank.federal / 100 },
            { source: 'state', target: 'account', value: bank.state / 100 },
            { source: 'private', target: 'account', value: bank.private / 100 },

            { source: 'account', target: 'approved', value: bank.approved / 100 },
            { source: 'account', target: 'requested', value: bank.requested / 100 },
        ]
    })
</script>

<VisSingleContainer {data}>
  <VisSankey labelMaxWidth={110} />
</VisSingleContainer>
