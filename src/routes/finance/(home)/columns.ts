import {
    createColumnHelper,
    createPaginatedRowModel,
    createSortedRowModel,
    renderComponent,
    rowPaginationFeature,
    rowSortingFeature,
    tableFeatures,
    type SortFn
} from '@tanstack/svelte-table';
import { ChevronsLeftRight } from '@lucide/svelte';
import type { PurchaseSnapshot, Stage } from '$lib/models/procurement';
import { budgetTotal, parsePersonnel, stageOf } from '$lib/data/snapshot-fields';
import DecisionBadge from './cells/DecisionBadge.svelte';
import PurposeCell from './cells/PurposeCell.svelte';
import SortButton from './cells/SortButton.svelte';



/** Extra classes for a column's header (`th`) and body (`td`) cells. */
interface ColumnMeta {
    headClass?: string;
    cellClass?: string;
}

export const features = tableFeatures({
    rowPaginationFeature,
    rowSortingFeature,
    paginatedRowModel: createPaginatedRowModel(),
    sortedRowModel: createSortedRowModel(),
    columnMeta: {} as ColumnMeta
});
export type RequestFeatures = typeof features;


// Columns
const column = createColumnHelper<RequestFeatures, PurchaseSnapshot>();

export const columns = column.columns([
    column.display({
        id: 'open',
        cell: () => renderComponent(ChevronsLeftRight, { class: '-rotate-45 stroke-1 transition-all hover:scale-110' }),
        meta: { headClass: 'w-6', cellClass: 'font-medium text-center' }
    }),
    column.accessor('request_id', {
        header: 'ID',
        meta: { cellClass: 'font-medium' }
    }),
    column.accessor('location', {
        header: 'Location'
    }),
    column.accessor((row) => stageOf(row), {
        id: 'stage',
        header: ({ column }) => renderComponent(SortButton, { column, label: 'Decision' }),
        cell: ({ getValue }) => renderComponent(DecisionBadge, { stage: getValue() }),
        sortFn: sortByStage
    }),
    column.accessor('purpose', {
        header: 'Purpose',
        cell: ({ getValue }) => renderComponent(PurposeCell, { purpose: getValue() })
    }),
    column.accessor((row) => parsePersonnel(row.personnel)[0]?.name ?? '—', {
        id: 'owner',
        header: 'Owner'
    }),
    column.accessor((row) => budgetTotal(row.budget), {
        id: 'budget',
        header: 'Budget',
        cell: ({ getValue }) => formatBudget(getValue()),
        meta: { headClass: 'text-end pr-5', cellClass: 'text-end pr-5' }
    }),
    column.accessor('updated_at', {
        header: ({ column }) => renderComponent(SortButton, { column, label: 'Updated' }),
        cell: ({ getValue }) => formatDate(getValue()),
        sortFn: sortByDate,
        sortDescFirst: true,
        meta: { cellClass: 'text-muted-foreground tabular-nums text-end pr-4' }
    })
]);

/** Newest updates first when the table loads. */
export const initialSorting = [{ id: 'updated_at', desc: true }];


// Sorting
/** Decisions sort in workflow order rather than alphabetically. */
const stageOrder: Stage[] = ['draft', 'fab_leadership_review', 'changes_requested', 'approved', 'rejected'];

function sortByStage(...[a, b, columnId]: Parameters<SortFn<RequestFeatures, PurchaseSnapshot>>) {
    return stageOrder.indexOf(a.getValue(columnId)) - stageOrder.indexOf(b.getValue(columnId));
}

/** Dates are "YYYY-MM-DD", so comparing the strings orders them by date. */
function sortByDate(...[a, b, columnId]: Parameters<SortFn<RequestFeatures, PurchaseSnapshot>>) {
    return a.getValue<string>(columnId).localeCompare(b.getValue<string>(columnId));
}


// Formatting
const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

function formatBudget(cents: number) {
    return cents ? currency.format(cents / 100) : 'Unset';
}

/** "2026-06-16" → "Jun 16, 2026" (built from parts so it isn't shifted by the time zone) */
function formatDate(iso: string) {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
