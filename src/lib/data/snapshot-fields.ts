import type {
    Budget,
    BudgetEntry,
    Footprint,
    CostCategory,
    Personnel,
    PersonnelEntry,
    PersonnelRole,
    PurchaseSnapshot,
    SpecEntry,
    Specification,
    SupportItem,
    SupportItemEntry,
    Vendor,
    Stage
} from '$lib/models/procurement';

/**
 * Converters for the ";"-separated text fields on PurchaseSnapshot and Vendor.
 * Each parse* has a matching serialize* so forms can round-trip a snapshot.
 */

const entries = (field: string | null | undefined) => field?.split(';').filter(Boolean) ?? [];
const join = (items: string[]) => (items.length ? items.join(';') : null);


// Programs: "RFPA;TV2;TV3"
export function parsePrograms(programs: string | null): string[] {
    return entries(programs);
}

export function serializePrograms(programs: string[]): string | null {
    return join(programs);
}


// Plain lists: "power;di_water"
export function parseList<T extends string = string>(list: string | null): T[] {
    return entries(list) as T[];
}

export function serializeList(items: string[]): string | null {
    return join(items);
}


// Footprint: "LxWxH" in mm, e.g. "2500x1800x2100". Unknown sides are left blank: "2500x1800x"
export function parseFootprint(footprint: string | null): Footprint {
    const [length, width, height] = (footprint?.split('x') ?? []).map((side) => (side ? Number(side) : null));
    return { length, width, height };
}

export function serializeFootprint({ length, width, height }: Footprint): string | null {
    return length || width || height ? [length, width, height].map((side) => side || '').join('x') : null;
}


// Personnel: "name:email:role;..."
export function parsePersonnel(personnel: string | null): Personnel[] {
    return (entries(personnel) as PersonnelEntry[]).map((entry) => {
        const [name, email, role] = entry.split(':');
        return { name, email, role: role as PersonnelRole };
    });
}

export function serializePersonnel(people: Personnel[]): string | null {
    return join(people.filter((p) => p.name.trim()).map((p) => `${p.name.trim()}:${p.email.trim()}:${p.role}`));
}


// Specs: "Title=value;..."
export function parseSpecs(specs: string | null): Specification[] {
    return (entries(specs) as SpecEntry[]).map((entry) => {
        const at = entry.indexOf('=');
        return { title: entry.slice(0, at), value: entry.slice(at + 1) };
    });
}

export function serializeSpecs(specs: Specification[]): string | null {
    return join(specs.map((s) => `${s.title}=${s.value ?? ''}`));
}


// Support items: "name|cents|lead weeks|LxWxH mm;..."
export function parseSupportItems(items: string | null): SupportItem[] {
    return (entries(items) as SupportItemEntry[]).map((entry) => {
        const [name, cents, weeks, size] = entry.split('|');
        return { name, cost: Number(cents) || 0, lead_time_weeks: weeks ? Number(weeks) : null, size: size || null };
    });
}

export function serializeSupportItems(items: SupportItem[]): string | null {
    const clean = (text: string) => text.replace(/\s*[|;]\s*/g, ' ').trim(); // separators can't appear inside a name
    return join(
        items
            .filter((item) => clean(item.name))
            .map((item) => [clean(item.name), Math.round(item.cost || 0), item.lead_time_weeks || '', item.size ?? ''].join('|'))
    );
}


// Budget: "category-cents;..."
export function parseBudget(budget: string | null): Budget {
    return Object.fromEntries(
        (entries(budget) as BudgetEntry[]).map((entry) => {
            const [category, cents] = entry.split('-');
            return [category as CostCategory, Number(cents)];
        })
    );
}

export function serializeBudget(budget: Budget): string | null {
    return join(
        Object.entries(budget)
            .filter(([, cents]) => cents && cents > 0)
            .map(([category, cents]) => `${category}-${Math.round(cents!)}`)
    );
}

/** Total of every budget line, in USD cents. */
export function budgetTotal(budget: string | null): number {
    return Object.values(parseBudget(budget)).reduce((sum, cents) => sum + (cents ?? 0), 0);
}

/** A vendor with enough to be submitted: manufacturer, model, and a purchase price. */
export function isComplete(vendor: Pick<Vendor, 'manufacturer' | 'model' | 'costs'>): boolean {
    return Boolean(vendor.manufacturer && vendor.model && parseBudget(vendor.costs).purchase);
}

/** A vendor's quoted total in USD cents: every cost line, less the discount. */
export function vendorTotal(vendor: Pick<Vendor, 'costs' | 'discount'>): number {
    return budgetTotal(vendor.costs) - (vendor.discount ?? 0);
}


// Review state
/** Where a snapshot sits in the review workflow. */
export function stageOf(snapshot: Pick<PurchaseSnapshot, 'forwarded' | 'decision'>): Stage {
    if (snapshot.decision) return snapshot.decision;
    return snapshot.forwarded ? 'fab_leadership_review' : 'draft';
}

/** A snapshot is editable until FAB Leadership records any decision. */
export function isLocked(snapshot: Pick<PurchaseSnapshot, 'decision'>): boolean {
    return snapshot.decision !== null;
}

/** "EPG-01-2" → 2 */
export function versionOf(snapshot: Pick<PurchaseSnapshot, 'id'>): number {
    return Number(snapshot.id.split('-').at(-1));
}
