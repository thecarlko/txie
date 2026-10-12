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
    | "support_equipment"
    | "additional";
export type Utility = "power" | "process_gases" | "chemicals" | "exhaust" | "di_water" | "compressed_air" | "network" | "low_vibration";
export type VendorFlag = "hazardous_materials" | "facility_modification" | "export_controlled" | "new_vendor" | "refurbished";


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

/**
 * One vendor's equipment offer for a purchase request (a row of vendors.json).
 * A request can have several; they're grouped by the shared `request_id`, not by draft version.
 */
export interface Vendor {
    id: string;                     // "{request_id}-V{n}", e.g. "EPG-12-V1"
    request_id: string;             // Purchase request this quote is for, e.g. "EPG-12"
    created_at: string;             // "YYYY-MM-DD"
    updated_at: string;             // "YYYY-MM-DD"

    // Equipment
    manufacturer: string;
    model: string;
    configuration: string | null;   // e.g. "200/300mm, 4 baths: Cu RDL, Bump Cu, Bump Ni, Bump SnAg"
    lead_time_weeks: number | null; // Tool lead time
    costs: string | null;           // Same format as PurchaseSnapshot.budget: "purchase-118000000;fit_up-25000000" (USD cents).
                                    // `support_equipment` is always the sum of `support_items`
    discount: number | null;        // USD cents, subtracted from the cost total (see vendorTotal())

    // Support equipment TIE procures alongside the tool
    support_items: string | null;   // "name|cents|lead weeks|LxWxH mm;...", e.g. "Chiller|2500000|9|1000x380x1700"

    // Facility
    footprint: string | null;       // "LxWxH" in mm, e.g. "2500x1800x2100"
    utilities: string | null;       // "power;compressed_air;network"
    utility_notes: string | null;   // e.g. "208 V 3-phase, 40 A, N2 and CDA"
    facility_analysis: boolean;     // Facilities capacity analysis completed (UPW, chemicals, power, ...)
    facility_work: string | null;   // Work required when the `facility_modification` flag is set
    facility_lead_time_weeks: number | null;
    facility_approved: boolean;     // Facilities informed of and approved the work
    flags: string | null;           // Flags that apply: "hazardous_materials;new_vendor"

    recommended: boolean;           // At most one vendor per request
}

/** Entry formats inside the ";"-separated fields above. */
export type PersonnelEntry = `${string}:${string}:${PersonnelRole}`; // name:email:role
export type BudgetEntry = `${CostCategory}-${number}`;               // category-cents
export type SpecEntry = `${string}=${string}`;                       // title=value
export type SupportItemEntry = `${string}|${number}|${string}|${string}`; // name|cents|lead weeks|LxWxH mm

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
export type Footprint = Partial<Record<"length" | "width" | "height", number | null>>; // mm

export interface SupportItem {
    name: string;                   // e.g. "Dual-cabinet bath analyzer"
    cost: number;                   // USD cents
    lead_time_weeks: number | null;
    size: string | null;            // Same format as Vendor.footprint
}

/** One row of faculty.json. A person appears once per email address. */
export interface FacultyMember {
    name: string;
    email: string;
}