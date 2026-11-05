import type { Series } from '$lib/spc/analysis';

// Read-only: the dashboard renders the analysis output as written by `bun run spc`.
export const load = async ({ fetch }) => {
    const res = await fetch('/metro/analysis.json');
    const analysis: Record<string, Series[]> = res.ok ? await res.json() : {};
    return { analysis };
};
