export type Location = "MER" | "MR2";
export type NeedType = "new_capability" | "replacement" | "capacity" | "end_of_life" | "recurring_failure";
export type Firmness = "hard" | "target" | "flexible";
export type Force = "none" | "expedited" | "emergency"; // none = standard, expedited = time-limited offer, emergency = tool down
export type Decision = "approved" | "rejected" | "changes_requested"; // set by FAB Leadership; any decision locks the snapshot
export type Stage = "draft" | "fab_leadership_review" | Decision;     // derived from `forwarded` + `decision`, see stageOf()
export type PersonnelRole = "equipment_owner" | "requester" | "operator" | "backup_operator" | "maintenance";
export type CostCategory =
    | "purchase"
    | "shipping"
    | "install_services"
    | "fit_up"
    | "training"
    | "spares"
    | "service_contract"
    | "additional";


export interface PurchaseSnapshot {
    id: string;                     // "{request_id}-{version}", e.g. "EPG-01-1" (version 2+ exist after changes are requested)
    request_id: string;             // Parent request, e.g. "EPG-01"
    created_at: string;             // "YYYY-MM-DD"
    updated_at: string;             // "YYYY-MM-DD"

    // What & where
    location: Location;
    purpose: string;                // Equipment name / purpose
    purpose_type: NeedType;
    purpose_details: string | null; // What it will do and why
    current_gap: string | null;     // What can't be done today

    // Allocations
    programs: string | null;        // "RFPA;TV2;TV3"
    personnel: string | null;       // "Jonah Neff:jonah.neff@austin.utexas.edu:equipment_owner;Leonel Arana:..."
    specs: string | null;           // "Wafer Size=150mm"
    budget: string | null;          // "purchase-60000000;fit_up-10000000" (USD cents)
    attachments: string | null;

    // Timing
    target_date: string;            // Target operational date, "YYYY-MM-DD"
    date_firmness: Firmness;
    date_force: Force;
    consequence?: string | null;    // What happens if it's late

    // Review
    forwarded: boolean;             // Sent to FAB Leadership for review
    decision: Decision | null;      // null = still editable
    decision_comments: string | null;
    approved_budget?: number | null; // Envelope set by FAB Leadership on approval (USD cents)
}

/** Entry formats inside the ";"-separated fields above. */
export type PersonnelEntry = `${string}:${string}:${PersonnelRole}`; // name:email:role
export type BudgetEntry = `${CostCategory}-${number}`;               // category-cents
export type SpecEntry = `${string}=${string}`;                       // title=value

/** Parsed shapes of those entries. */
export interface Personnel {
    name: string;
    email: string;
    role: PersonnelRole;
}

export interface Specification {
    title: string;                  // e.g. "Wafer Size"
    value: string;                  // e.g. "150mm"
}

export type Budget = Partial<Record<CostCategory, number>>; // { purchase: 60000000, fit_up: 10000000 }

/** One row of faculty.json. A person appears once per email address. */
export interface FacultyMember {
    name: string;
    email: string;
}