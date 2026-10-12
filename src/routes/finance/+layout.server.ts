import { fetchSnapshots } from '$lib/server/smartsheet';
import type { LayoutServerLoad } from './$types';

/** Purchase snapshots from the official Smartsheet, shared by every finance page. */
export const load: LayoutServerLoad = async ({ fetch }) => {
    return { snapshots: await fetchSnapshots(fetch) };
};
