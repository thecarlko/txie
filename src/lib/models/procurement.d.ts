type NeedType = "new_capability" | "replacement" | "capacity" | "end_of_life" | "recurring_failure";
type Path = "standard" | "expedited" | "emergency"; // Mapped from proposal.svelte 'force'
type Firmness = "hard" | "target" | "flexible";
type Stage = "draft" | "fab_leadership_review" | "rejected" | "approved";

interface Request {
    id: string;
    request_number: string; // Legacy ID (e.g., EPG-40)
    
    // Core Svelte Form State
    purpose: string; // Equipment name / purpose
    location: "mer" | "mr2" | ""; // Location selection
    need_type: NeedType;
    details: string; // What it will do and why
    gap: string; // What can't be done today
    due_date: string; // Target operational date (ISO 8601)
    consequence_if_late: string;
    firmness: Firmness; 
    path: Path; // standard (No), expedited (Time-limited offer), emergency (Tool down)
    stage: Stage;
    
    // Legacy Request Fields (Table 1)
    legacy_requester: string; // e.g., "Barry Allen (barry_allen@txie.org)"
    legacy_vendor: string; // Vendor pre-selected in legacy system
    legacy_model: string; // Model pre-selected in legacy system
    legacy_req_number: string;
    legacy_po_number: string;
    legacy_po_status: string;
    legacy_phase: string; // Deprecated "Phase" field
    legacy_supported: string; // Deprecated "Supported" field
    legacy_project: string; // e.g., PM, TV, PV
    legacy_customer_type: "dod" | "commercial"; 
}



interface Personnel {
    id: string;
    request_id: string;
    name: string;
    email: string;
    role: "equipment_owner" | "operator" | "backup_operator" | "maintenance";
}

interface ProgramAllocation {
    id: string;
    request_id: string;
    program_name: string; // e.g., "PM6.2", "TV1", or custom typed entries
}

interface Specification {
    id: string;
    request_id: string;
    spec_title: string; // e.g., "Footprint / Dimensions", "Throughput", or custom
    spec_value: string; // e.g., "2.5m x 1.8m", "100 WPH"
}

interface Attachment {
    id: string;
    request_id: string;
    file_name: string;
    file_size_bytes: number;
    file_url: string; // Storage pointer
}



type CostCategory = 
    | "purchase" 
    | "shipping" 
    | "install_services" 
    | "fit_up" 
    | "training" 
    | "spares" 
    | "service_contract" 
    | "additional"
    | "legacy_fit_up_and_shipping"; // Kept solely for legacy migration integrity

interface CostLine {
    id: string;
    request_id: string;
    category: CostCategory;
    estimate: number; // Stored in USD cents (e.g., $280,010.00 = 28001000)
}


interface RequestVersion {
    id: string;
    request_id: string;
    version_number: number; // 1, 2, 3... increments if changes are requested
    snapshot: Record<string, any>; // JSON payload of the entire Request, Costs, Specs, and Personnel at time of submission
    submitted_by: string; // User ID matching the requester
    submitted_at: string; // ISO 8601 timestamp
}

type FABLeadershipDecision = "approved" | "changes_requested" | "rejected";

interface Review {
    id: string;
    request_id: string;
    request_version_id: string; // Ties the leadership decision to the exact frozen snapshot
    outcome: FABLeadershipDecision;
    decider_id: string; // User ID of the FAB Leader
    comments?: string; // Feedback returned to the engineer if changes are requested
    decided_at: string; // ISO 8601 timestamp
}


