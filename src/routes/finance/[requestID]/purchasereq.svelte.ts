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
    | "additional"
    | "legacy_fit_up_and_shipping";
export type Firmness = "hard" | "target" | "flexible";
export type FABLeadershipDecision = "approved" | "changes_requested" | "rejected";


class PurchaseRequest {
    id: string;

    submitted_by: string = $state("");
    submitted_at: string = $state("");
    stage: "draft" | "sourcing" | "rejected" | "approved" = $state("draft");


    constructor() {
        this.id = generateID();
    }

}


export interface Personnel {
    id: string;
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


    location: "mer" | "mr2" = $state("mer");

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

export interface Personnel {
    id: string;
    // request_id: string;
    name: string;
    email: string;
    role: "equipment_owner" | "operator" | "backup_operator" | "maintenance";
}


