import { database } from '$lib/data/smartsheet.svelte';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

// Requests created in the browser only exist in localStorage, so the server can't render them.
export const ssr = false;

/** `requestID` is the parent request, e.g. "EPG-01". The page shows its snapshot versions. */
export const load: PageLoad = async ({ params, parent }) => {
    await parent(); // the finance layout fills the database from the sheet
    if (!database.latest(params.requestID)) {
        error(404, { message: 'Purchase request not found' });
    }

    return { requestID: params.requestID };
};
