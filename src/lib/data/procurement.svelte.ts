import type { PurchaseRequest, PurchaseSnapshot } from "$lib/models/procurement";
import { generateID } from '$lib/hooks/hash';
import reqs from '$lib/data/requests.json'
import snaps from '$lib/data/snapshots.json'
import { goto } from "$app/navigation";

class ProcurementDB {
    purchase_requests: Record<string, PurchaseRequest> = $state(reqs as Record<string, any>);
    purchase_snapshots: Record<string, PurchaseSnapshot> = $state(snaps as Record<string, any>);
}

export const database = new ProcurementDB();
export function createPurchaseRequest() {
        const requestId = generateID();
        const snapshotId = generateID();
        const now = new Date();
        
        // Calculate a default due date 3 months out
        const targetDate = new Date(now);
        targetDate.setMonth(now.getMonth() + 3);

        // 1. Generate Draft 1 Snapshot
        const draftSnapshot: PurchaseSnapshot = {
            id: snapshotId,
            version_number: 1,
            request_id: requestId, // Link to parent
            purpose: "",
            location: "",
            need_type: "new_capability",
            details: "",
            gap: "",
            due_date: targetDate.toISOString(),
            consequence_if_late: "",
            firmness: "flexible",
            programs: [],
            personnel: [
                { id: generateID(), name: "Kobe", email: "kobe@txie.org", role: "equipment_owner" }
            ],
            specs: [],
            receipt: { purchase: 0 }
        };

        // 2. Generate Parent Request
        const newRequest: PurchaseRequest = {
            id: requestId,
            // Automatically generate a sequential legacy EPG number based on current count
            request_number: `EPG-${Object.keys(database.purchase_requests).length + 40}`, 
            latest_snapshot: snapshotId, // Link to child
            submitted_by: "usr-kobe",
            submitted_at: now.toISOString(),
            stage: "draft"
        };

        // 3. Commit to state dictionary
        database.purchase_requests[requestId] = newRequest;
        database.purchase_snapshots[snapshotId] = draftSnapshot;

        return requestId;
    }



