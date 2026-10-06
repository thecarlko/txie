import type {
    Budget,
    BudgetEntry,
    CostCategory,
    Personnel,
    PersonnelEntry,
    PersonnelRole,
    PurchaseSnapshot,
    SpecEntry,
    Specification,
    Stage
} from '$lib/models/procurement';

/**
 * Converters for the ";"-separated text fields on PurchaseSnapshot.
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
