
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import proposalsJSON from '$lib/json/proposals.json';
import type { PurchaseSnapshot } from '$lib/models/procurement';




export const load: PageLoad = ({ params }) => {
    const proposals = proposalsJSON as PurchaseSnapshot[];
    return { proposals };
};