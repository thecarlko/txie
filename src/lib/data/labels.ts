import type {
    CostCategory,
    Decision,
    Firmness,
    Force,
    Location,
    NeedType,
    PersonnelRole,
    Utility,
    VendorFlag
} from '$lib/models/procurement';

/** Display text for the stored codes, matching the wording on the forms. */

export const locationLabel: Record<Location, string> = {
    MER: 'Microelectronics Research Center',
    MR2: 'Montopolis Fabrication Bldg.'
};

export const needTypeLabel: Record<NeedType, string> = {
    new_capability: 'New capability',
    replacement: 'Replacement',
    capacity: 'More capacity',
    end_of_life: 'End of life',
    recurring_failure: 'Keeps failing'
};

export const roleLabel: Record<PersonnelRole, string> = {
    equipment_owner: 'Equipment owner',
    requester: 'Requester',
    operator: 'Operator',
    backup_operator: 'Backup operator',
    maintenance: 'Maintenance'
};

export const costLabel: Record<CostCategory, string> = {
    purchase: 'Purchase Price',
    shipping: 'Shipping & Freight',
    install_services: 'Vendor Installation',
    fit_up: 'Facility Fit-Up',
    training: 'Training',
    spares: 'Spare Parts',
    service_contract: 'Service Contract',
    support_equipment: 'Support Equipment',
    additional: 'Miscellaneous & Fees'
};

export const utilityLabel: Record<Utility, string> = {
    power: 'High power',
    process_gases: 'Process gases',
    chemicals: 'Chemicals',
    exhaust: 'Exhaust',
    di_water: 'DI water',
    compressed_air: 'Compressed air',
    network: 'Network',
    low_vibration: 'Low vibration'
};

export const flagLabel: Record<VendorFlag, string> = {
    hazardous_materials: 'Uses hazardous gases or chemicals',
    facility_modification: 'Needs facility modifications',
    export_controlled: 'Export-controlled',
    new_vendor: 'Vendor is new to TxIE',
    refurbished: 'Used or refurbished'
};

export const firmnessLabel: Record<Firmness, string> = {
    hard: 'Hard deadline',
    target: 'Target',
    flexible: 'Flexible'
};

export const forceLabel: Record<Force, string> = {
    none: 'Nothing forcing it',
    expedited: 'Time-limited offer',
    emergency: 'A tool is down'
};

export const decisionLabel: Record<Decision, string> = {
    approved: 'Approved',
    changes_requested: 'Changes requested',
    rejected: 'Rejected'
};

/** "2026-12-31" → "Dec 31, 2026" */
export function formatDate(iso: string): string {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
