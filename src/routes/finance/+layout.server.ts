import { fetchSnapshots, fetchVendors } from '$lib/server/smartsheet';
import type { LayoutServerLoad } from './$types';

/** Official purchase snapshots and vendor quotes, shared by every finance page. */
export const load: LayoutServerLoad = async ({ fetch }) => {
    const [snapshots, vendors] = await Promise.all([fetchSnapshots(fetch), fetchVendors(fetch)]);
    return { snapshots, vendors };
};
