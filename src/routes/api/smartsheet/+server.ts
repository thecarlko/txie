import { saveSnapshots, type SnapshotChanges } from '$lib/server/smartsheet';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, fetch }) => {
    try {
        const changes = (await request.json()) as SnapshotChanges;
        console.debug('[smartsheet] api:received', {
            updateIDs: Object.keys(changes.updates ?? {}),
            createIDs: Object.keys(changes.creates ?? {}),
            deleteIDs: changes.deletes ?? []
        });
        await saveSnapshots(changes, fetch);
        console.debug('[smartsheet] api:complete');
        return new Response(null, { status: 204 });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown Smartsheet save error';
        console.error(message);
        return new Response(message, { status: 502 });
    }
};
