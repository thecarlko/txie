/** Local changes relative to the last successfully loaded or saved sheet. */
export type SheetChanges<T> = {
    updates: Record<string, Partial<T>>;
    creates: Record<string, T>;
    deletes: string[];
};

export function seed<T extends { id: string }>(rows: T[]): Record<string, T> {
    return Object.fromEntries(structuredClone(rows).map((row) => [row.id, row]));
}

export function sheetChanges<T extends { id: string }>(rows: Record<string, T>, official: Record<string, T>): SheetChanges<T> {
    const updates: Record<string, Partial<T>> = {};
    const creates: Record<string, T> = {};
    for (const [id, row] of Object.entries(rows)) {
        if (!official[id]) {
            creates[id] = row;
            continue;
        }
        const patch = Object.fromEntries(
            (Object.keys(row) as (keyof T)[])
                .filter((key) => row[key] !== official[id][key])
                .map((key) => [key, row[key]])
        ) as Partial<T>;
        if (Object.keys(patch).length) updates[id] = patch;
    }
    return { updates, creates, deletes: Object.keys(official).filter((id) => !rows[id]) };
}

export function hasChanges<T>(changes: SheetChanges<T>): boolean {
    return !!(changes.deletes.length || Object.keys(changes.updates).length || Object.keys(changes.creates).length);
}

export function applyChanges<T>(rows: Record<string, T>, changes: SheetChanges<T>): void {
    for (const [id, patch] of Object.entries(changes.updates)) {
        if (rows[id]) rows[id] = { ...rows[id], ...patch };
    }
    for (const [id, row] of Object.entries(changes.creates)) rows[id] = structuredClone(row);
    for (const id of changes.deletes) delete rows[id];
}
