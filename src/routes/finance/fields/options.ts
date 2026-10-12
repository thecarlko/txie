import type { Component } from "svelte";
import {
    Activity, Biohazard, Building, Cylinder, DollarSign, Droplets, Ellipsis, Factory, Fan, FlaskConical, Gauge, Globe,
    GraduationCap, Handshake, HardHat, Hourglass, Network, Package, Recycle, Replace, RotateCcw, Sparkles,
    TestTubeDiagonal, Truck, Wind, Zap
} from "@lucide/svelte";
import { costLabel, flagLabel, locationLabel, needTypeLabel, roleLabel, utilityLabel } from "$lib/data/labels";
import { parseBudget } from "$lib/data/snapshot-fields";
import type { Budget, CostCategory, Location, NeedType, PersonnelRole, Utility, VendorFlag } from "$lib/models/procurement";

/** Selected look for chips in a ToggleGroup */
export const chip = "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary";

type Option<T extends string> = { value: T; label: string; icon: Component };


// --- Proposal ---
export const locations: Option<Location>[] = [
    { value: "MER", label: locationLabel.MER, icon: TestTubeDiagonal },
    { value: "MR2", label: locationLabel.MR2, icon: Factory },
];

export const needTypes: (Option<NeedType> & { hint: string })[] = [
    { value: "new_capability", label: needTypeLabel.new_capability, hint: "Something we can't do today", icon: Sparkles },
    { value: "replacement", label: needTypeLabel.replacement, hint: "Swap out an existing tool", icon: Replace },
    { value: "capacity", label: needTypeLabel.capacity, hint: "Demand is outgrowing what we have", icon: Gauge },
    { value: "end_of_life", label: needTypeLabel.end_of_life, hint: "Vendor support is ending", icon: Hourglass },
    { value: "recurring_failure", label: needTypeLabel.recurring_failure, hint: "Repeated downtime or repairs", icon: RotateCcw },
];

export const roles = (Object.entries(roleLabel) as [PersonnelRole, string][]).map(([value, label]) => ({ value, label }));

export const defaultSpecs = [
    { id: "footprint", label: "Footprint / Dimensions", placeholder: "e.g., 2.5m x 1.8m" },
    { id: "throughput", label: "Throughput", placeholder: "e.g., 100 WPH" },
    { id: "accuracy", label: "Accuracy", placeholder: "e.g., ±0.5 µm" },
    { id: "power", label: "Power Requirements", placeholder: "e.g., 208V 3-phase" },
    { id: "weight", label: "Weight", placeholder: "e.g., 1500 kg" },
];


// --- Costs (proposal budget and vendor quotes share the same lines; `support_equipment` is itemized separately) ---
type CostItem = { key: CostCategory; label: string; icon: Component; placeholder: string };
const cost = (key: CostCategory, icon: Component, placeholder: string): CostItem => ({ key, label: costLabel[key], icon, placeholder });

export const costItems: CostItem[] = [
    cost("purchase", DollarSign, "280,000"),
    cost("shipping", Truck, "10,000"),
    cost("install_services", Replace, "5,000"),
    cost("fit_up", HardHat, "15,000"),
    cost("training", GraduationCap, "2,500"),
    cost("spares", Package, "3,000"),
    cost("service_contract", Handshake, "7,500"),
    cost("additional", Ellipsis, "0"),
];

/** Every line but the purchase price, which is always on */
export const optionalCosts = costItems.filter((c) => c.key !== "purchase");

/** Lines counted in the total and the save. Deselected categories keep their amount in the form. */
export function activeCosts(categories: string[]): CostItem[] {
    return costItems.filter((c) => c.key === "purchase" || categories.includes(c.key));
}

/** A stored budget (cents) as form amounts (dollars) */
export function budgetDollars(budget: string | null): Partial<Record<CostCategory, number>> {
    return Object.fromEntries(Object.entries(parseBudget(budget)).map(([key, cents]) => [key, (cents ?? 0) / 100]));
}

/** The optional categories a stored budget has amounts for, to preselect their chips */
export function savedCategories(amounts: Partial<Record<CostCategory, number>>): string[] {
    return optionalCosts.filter((c) => c.key in amounts).map((c) => c.key);
}

/** Form amounts (dollars) for the active lines, in cents for serializeBudget() */
export function activeCents(amounts: Partial<Record<CostCategory, number>>, categories: string[]): Budget {
    return Object.fromEntries(activeCosts(categories).map((c) => [c.key, (amounts[c.key] ?? 0) * 100]));
}

/** Total of the active lines, in dollars */
export function activeTotal(amounts: Partial<Record<CostCategory, number>>, categories: string[]): number {
    return activeCosts(categories).reduce((sum, c) => sum + (amounts[c.key] ?? 0), 0);
}


// --- Vendor facility ---
export const dimensions = [
    { key: "length", label: "Length (mm)" },
    { key: "width", label: "Width (mm)" },
    { key: "height", label: "Height (mm)" },
] as const;

export const utilities: Option<Utility>[] = [
    { value: "power", label: utilityLabel.power, icon: Zap },
    { value: "process_gases", label: utilityLabel.process_gases, icon: Cylinder },
    { value: "chemicals", label: utilityLabel.chemicals, icon: FlaskConical },
    { value: "exhaust", label: utilityLabel.exhaust, icon: Wind },
    { value: "di_water", label: utilityLabel.di_water, icon: Droplets },
    { value: "compressed_air", label: utilityLabel.compressed_air, icon: Fan },
    { value: "network", label: utilityLabel.network, icon: Network },
    { value: "low_vibration", label: utilityLabel.low_vibration, icon: Activity },
];

export const flags: { key: VendorFlag; label: string; hint: string; icon: Component }[] = [
    { key: "hazardous_materials", label: flagLabel.hazardous_materials, hint: "EHS will review before it's powered up.", icon: Biohazard },
    { key: "facility_modification", label: flagLabel.facility_modification, hint: "New utilities, structural work, or a pedestal.", icon: HardHat },
    { key: "export_controlled", label: flagLabel.export_controlled, hint: "May need a license or extra paperwork.", icon: Globe },
    { key: "new_vendor", label: flagLabel.new_vendor, hint: "Not on our current vendor list.", icon: Building },
    { key: "refurbished", label: flagLabel.refurbished, hint: "Adds inspection and decontamination steps.", icon: Recycle },
];
