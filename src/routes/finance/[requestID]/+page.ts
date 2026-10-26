import { database } from '$lib/data/smartsheet.svelte';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

/** `requestID` is the parent request, e.g. "EPG-01". The page shows its snapshot versions. */
export const load: PageLoad = async ({ params, parent }) => {
    await parent(); // wait for the finance layout's initial database hydration
    if (!database.latest(params.requestID)) {
        error(404, { message: 'Purchase request not found' });
    }

    return { requestID: params.requestID };
};
