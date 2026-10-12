import { saveSnapshots, saveVendors, type SnapshotChanges, type VendorChanges } from '$lib/server/smartsheet';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, fetch }) => {
    try {
        const changes = (await request.json()) as
            | (SnapshotChanges & { sheet?: 'snapshots' })
            | (VendorChanges & { sheet: 'vendors' });
        console.debug('[smartsheet] api:received', {
            updateIDs: Object.keys(changes.updates ?? {}),
            createIDs: Object.keys(changes.creates ?? {}),
            deleteIDs: changes.deletes ?? []
        });
        if (changes.sheet === 'vendors') await saveVendors(changes, fetch);
        else if (changes.sheet === undefined || changes.sheet === 'snapshots') await saveSnapshots(changes, fetch);
        else return new Response('Unknown Smartsheet table', { status: 400 });
        console.debug('[smartsheet] api:complete');
        return new Response(null, { status: 204 });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown Smartsheet save error';
        console.error(message);
        return new Response(message, { status: 502 });
    }
};
