import { database } from '$lib/data/smartsheet.svelte';
import type { LayoutLoad } from './$types';

// Finance uses a browser-owned database, including locally created requests.
export const ssr = false;

/** Hover preloads and navigation share one hydration for this app session. */
export const load: LayoutLoad = async ({ fetch }) => {
    await database.ensureHydrated(fetch);
};
