import { database } from '$lib/data/smartsheet.svelte';
import type { LayoutLoad } from './$types';

/** Fill the database before any finance page's load or component reads from it. */
export const load: LayoutLoad = ({ data }) => {
    database.hydrate(data.snapshots, data.vendors);
    return data;
};
