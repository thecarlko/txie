import { browser } from '$app/environment';
import { applyChanges, hasChanges, seed, sheetChanges, type SheetChanges } from './sheet-changes';

// Sheet rows contain only plain scalar fields, so their snapshots preserve the row type.
function plain<T>(value: T): T {
    return $state.snapshot(value) as T;
}

/** Shared hydration and persistence for purchase snapshots and vendor quotes. */
export class SheetSync<T extends { id: string }> {
    #official = $state<Record<string, T>>({});
    #hydrated = false;
    #saving: Promise<void> | null = null;

    constructor(
        private key: string,
        private sheet: 'snapshots' | 'vendors',
        private rows: () => Record<string, T>,
        private replace: (rows: Record<string, T>) => void,
        private migrateLegacy?: (rows: Record<string, any>) => Record<string, T>
    ) {}

    hydrate(rows: T[]): void {
        const pending = this.#hydrated
            ? plain(sheetChanges(this.rows(), this.#official))
            : this.loadChanges();
        this.#official = seed(rows);
        const merged = seed(rows);
        applyChanges(merged, pending);
        this.replace(merged);

        if (!browser || this.#hydrated) return;
        this.#hydrated = true;
        $effect.root(() => {
            $effect(() => {
                const changes = JSON.stringify(sheetChanges(this.rows(), this.#official));
                const timer = setTimeout(() => this.persist(JSON.parse(changes)), 300);
                return () => clearTimeout(timer);
            });
        });
    }

    private loadChanges(): SheetChanges<T> {
        const empty = { updates: {}, creates: {}, deletes: [] };
        if (!browser) return empty;
        try {
            const saved = localStorage.getItem(this.key);
            if (!saved) return empty;
            const parsed = JSON.parse(saved);
            if (parsed.updates && parsed.creates && Array.isArray(parsed.deletes)) return parsed;
            // Only snapshots previously persisted a table that can be migrated as edits.
            if (this.migrateLegacy) return { ...empty, updates: this.migrateLegacy(parsed) };
        } catch {
            // Corrupt or unavailable storage: use the official rows.
        }
        return empty;
    }

    private persist(changes: SheetChanges<T>): void {
        if (hasChanges(changes)) localStorage.setItem(this.key, JSON.stringify(changes));
        else localStorage.removeItem(this.key);
    }

    save({ keepalive = false }: { keepalive?: boolean } = {}): Promise<void> {
        if (!browser || !this.#hydrated) return Promise.resolve();
        if (this.#saving) return this.#saving;
        this.#saving = this.flush(keepalive).finally(() => { this.#saving = null; });
        return this.#saving;
    }

    private async flush(keepalive: boolean): Promise<void> {
        for (;;) {
            // Capture the submitted values so edits during the request remain pending.
            const changes = plain(sheetChanges(this.rows(), this.#official));
            if (!hasChanges(changes)) return;
            this.persist(changes);
            const response = await fetch('/api/smartsheet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...changes, sheet: this.sheet }),
                keepalive
            });
            if (!response.ok) {
                this.persist(plain(sheetChanges(this.rows(), this.#official)));
                throw new Error(`Saving ${this.sheet} to Smartsheet failed: ${response.status}: ${await response.text()}`);
            }
            applyChanges(this.#official, changes);
            this.persist(plain(sheetChanges(this.rows(), this.#official)));
            // Drain edits made while saving, including when another tab change called save().
        }
    }

    reset(): void {
        this.replace(plain(this.#official));
    }
}
