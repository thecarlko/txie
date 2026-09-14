



<script lang='ts'>
    import { bank } from '$lib/data/bank.svelte';
    import { VisSingleContainer, VisSankey } from '@unovis/svelte'
    let data = {
        nodes: [
            { id: 'federal', color: "oklch(83.3% 0.145 321.434)", label: 'Federal' },
            { id: 'state', color: "oklch(78.5% 0.115 274.713)", label: 'State' },
            { id: 'private', color: "oklch(82.8% 0.111 230.318)", label: 'Private' },

            { id: 'account', color: "oklch(70.7% 0.022 261.325)", label: 'Account' },

            { id: 'spent', color: "oklch(64.5% 0.246 16.439)", label: 'Spent' },
            { id: 'pending', color: "oklch(64.6% 0.222 41.116)", label: 'Pending' },
            { id: 'review', color: "oklch(85.2% 0.199 91.936)", label: 'In Review' },
            // { id: 'available', color: "oklch(79.2% 0.209 151.711)", label: 'Available' },
        ],
        links: [
            { source: 'federal', target: 'account', value: bank.federal },
            { source: 'state', target: 'account', value: bank.state },
            { source: 'private', target: 'account', value: bank.private },

            { source: 'account', target: 'spent', value: bank.spent },
            { source: 'account', target: 'pending', value: bank.pending },
            { source: 'account', target: 'review', value: bank.review },
            // { source: 'account', target: 'available', value: bank.available }
        ]
    }
</script>

<VisSingleContainer {data}>
  <VisSankey/>
</VisSingleContainer>




