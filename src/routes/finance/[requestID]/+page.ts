import { database } from '$lib/data/procurement.svelte';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
    const request = database.purchase_requests[params.requestID];

    if (!request) {
        error(404, { message: 'Purchase request not found' });
    }

    const snapshot = database.purchase_snapshots[request.latest_snapshot];

    if (!snapshot) {
        error(404, { message: 'Snapshot data not found' });
    }

    return {
        request,
        snapshot
    };
};