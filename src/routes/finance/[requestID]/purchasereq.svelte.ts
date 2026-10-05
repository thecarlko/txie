import { generateID } from "$lib/hooks/hash";




export type NeedType = "new_capability" | "replacement" | "capacity" | "end_of_life" | "recurring_failure";
export type CostCategory = 
    | "purchase" 
    | "shipping" 
    | "install_services" 
    | "fit_up" 
    | "training" 
    | "spares" 
    | "service_contract" 
    | "additional";
export type Firmness = "hard" | "target" | "flexible";
export type FABLeadershipDecision = "approved" | "changes_requested" | "rejected";


class PurchaseRequest {
    id: string;
    request_number: string = $state("");

    created_at: string = $state("");
    updated_at: string = $state("");

    constructor(request_number: string, id?: string) {
        this.id = id ?? generateID();
        this.request_number = request_number;
    }
}

/** Personnel */
export interface Personnel {
    name: string;
    email: string;
    role: "equipment_owner" | "operator" | "backup_operator" | "maintenance";
}

export interface Attachment {
    id: string;
    request_id: string;
    file_name: string;
    file_size_bytes: number;
    file_url: string; // Storage pointer
}

class Proposal {
    id: string;
    request_id: string; /** The ID of the purchase request this proposal is associated with */

    created_at: string = $state("");
    updated_at: string = $state("");

    location: "MER" | "MR2" = $state("MER");

    /** Equipment need / purpose */
    purpose: string = $state("");
    purpose_type: NeedType = $state("new_capability");
    purpose_details: string = $state("");
    current_gap: string = $state("");

    programs: string[] = $state([]);
    personnel: Personnel[] = $state([]);
    specs: [string, string][] = $state([ ["Weight", "1500kg"] ]);
    budget: [CostCategory, number][] = $state([ ["purchase", 10000] ]);

    target_date: string = $state("");
    date_firmness: Firmness = $state("target");
    date_force: "none" | "time_limited" | "tool_down" = $state("none");

    attachments: (string | Attachment)[] = $state([]);

    decision: FABLeadershipDecision | null = $state(null);
    decision_comments: string | null = $state(null);
    
    constructor(request_id: string) {
        this.id = generateID();
        this.request_id = request_id;
    }

}

type Utility = "power" | "process_gases" | "chemicals" | "exhaust" | "di_water" | "compressed_air" | "network" | "low_vibration";
type EquipmentFlag = "hazardous_materials" | "facility_modification" | "export_controlled" | "new_vendor" | "refurbished";
class Equipment {
    id: string;
    request_id: string;

    vendor: string = $state("");
    model: string = $state("");

    cost: [CostCategory, number][] = $state([ ["purchase", 10000] ]);

    utilities: Utility[] = $state([]);
    utility_note: string = $state("");

    flags: EquipmentFlag[] = $state([]);

    constructor(request_id: string) {
        this.id = generateID();
        this.request_id = request_id;
    }
}


