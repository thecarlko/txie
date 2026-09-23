

// ─────────────────────────────────────────────────────────────────────────────
// Primitives
// ─────────────────────────────────────────────────────────────────────────────
/** ISO 8601 instant, e.g. `2026-11-30T00:00:00Z`. */
type IsoDateTime = string;
type RequestId = string;


/**
 * Legacy-style natural key (§3.1), e.g. `EPG-40`. Kept alongside the internal `id`.
 * Left as a plain string rather than `` `EPG-${number}` `` because whether new
 * requests continue the EPG- sequence is an open question (§11.1).
 */
type RequestNumber = string;


/** Stages where work or a decision is still possible. */
type ActiveRequestStage =
  | "draft"
  | "draft_review"
  | "sourcing"
  | "vendor_review"
  | "contracting"
  | "fulfillment"
  | "installation"
  | "qualification"
  | "qualification_review"
  | "closeout";

/** §6.3: nothing transitions out of these. `closed_at` is set on entry. */
type TerminalRequestStage = "completed" | "rejected" | "withdrawn" | "cancelled";
type RequestStage = ActiveRequestStage | TerminalRequestStage;


/**
 * Informational flags (§6.2), no longer escalation triggers — see DIVERGENCE 2.
 * Each one adds required steps or documents later in the process.
 */
type RiskFlag =
  | "hazardous_materials"
  | "facility_modification"
  | "export_controlled"
  | "new_vendor"
  | "refurbished";

// ─────────────────────────────────────────────────────────────────────────────
// Request
// ─────────────────────────────────────────────────────────────────────────────

interface Request {
  readonly id: RequestId;

  /** What is the tool for */
  purpose: string;
  purpose_details: string | null;

  requester_id: string;
  owners: string[];

  /** The type of need being requested. */
  need_type:
    | "new_capability"
    | "replacement"
    | "capacity"
    | "end_of_life"
    | "recurring_failure";

  location: "MR2" | "MER";

  /** Default to midnight for time-sensitive requests. */
  need_by_date: IsoDateTime | null;

  consequence_if_missed: string | null;
  alternatives_considered: string | null;

  risk_flags: RiskFlag[];
  urgency: "standard" | "expedited" | "emergency";

  stage: RequestStage;

  cloned_from_id: RequestId | null;
  duplicate_of_id: RequestId | null;

  /** §8.4 Deprecated legacy "Phase", read-only (D-010). Never set on new requests. */
  readonly legacy_phase: string | null;
  readonly legacy_supported: string | null;
  readonly is_migrated: boolean;

  readonly created_at: IsoDateTime;

  /** Legacy-style natural key (§3.1), e.g. `EPG-40`. */
  readonly legacy_request_id: RequestNumber;

  submitted_at: IsoDateTime | null;
  updated_at: IsoDateTime;
  closed_at: IsoDateTime | null;
}

export type {
  ActiveRequestStage,
  IsoDateTime,
  Request,
  RequestId,
  RequestNumber,
  RequestStage,
  RiskFlag,
  TerminalRequestStage,
};