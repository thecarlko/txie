# TxIE tables

Tables should feel like carefully typeset engineering registers: stable, readable, and exact. Preserve the reference's row rhythm, fine horizontal rules, consistent selection placement, and compact actions. Use [colors.md](colors.md) and [typography.md](typography.md) as the shared source of values.

## Container and anatomy

Use the warm canvas, square corners, a fine perimeter rule when needed, and a slightly deeper header band. Resting tables do not need an outer drop shadow. Keep a descriptive title and concise context above the toolbar; expose count, active filters, and meaningful scope.

Suggested anatomy: title/context; filters/search and relevant actions; column header; rows; result count and pagination or loading controls. A bulk-action bar may appear when records are selected without displacing the table unpredictably.

Use horizontal separators by default. Add vertical rules selectively for grouped measurements, a frozen identifier column, or dense numeric blocks. Do not draw a heavy box around every cell.

## Record identity and column hierarchy

The primary data column anchors the record. Use a stable tool, request, wafer, or lot ID, with a concise descriptive name where appropriate. Preserve IDs exactly and make them easy to copy. Person avatars may help a staff directory but generic tool icons do not help distinguish equipment.

| Purpose | Example column sequence |
| --- | --- |
| Equipment inventory | Tool ID · Equipment · Facility / Bay · Owner · Operational status |
| Procurement review | Request ID · Equipment · Requester · Required date · Estimate · Review stage |
| Metrology results | Wafer ID · Process step · Measurement · Limit · Result · Measured at |

These are illustrative arrangements, not required schemas. Use real field definitions and permission rules. Prioritize the columns needed for the user's decision. Put occasional details in an expansion or detail panel rather than extending every row indefinitely.

## Dimensions and typography

| Element | Starting value |
| --- | --- |
| Single-line row | 44–48 px minimum |
| Row with secondary metadata | 56–64 px minimum |
| Compact row, if offered | 36–40 px minimum; retain usable controls |
| Horizontal cell padding | 16 px; 12 px in compact density |
| Header | Approximately 40–44 px, expandable for wrapping |
| Body text | 13–14 px |
| Compact uppercase header | 11–12 px with restrained tracking |

Allow rows to grow for meaningful wrapped content. Never clip important values to enforce a nominal height. Align text left, numbers right, and matching headers with their values. Use tabular figures. Put common units and currency in headers. Define precision from the data; missing values are not zero.

Use sentence case for descriptions and readable domain statuses. Uppercase headers must preserve unit case, such as `THICKNESS (µm)`.

## State system

| State | Treatment |
| --- | --- |
| Resting | Warm surface, carbon text, subtle horizontal rule |
| Hovered | Slight surface darkening, clearer row actions |
| Selected | Selected warm surface, carbon checked box, narrow orange leading marker |
| Keyboard focused | Clear outline around the actual focus target |
| Open in detail panel | Distinct current-record indicator tied to the panel |
| Archived / superseded | Readable data plus explicit state label |
| Unavailable action | Mute/disable that control and explain why |

Selection and current inspection are separate state variables. A row may be selected for export while another is open in a detail panel. Do not reuse the checkbox or the same ambiguous highlight to represent both.

Do not fade an entire archived row until its measurements become hard to read. Avoid color-only status. A rejected proposal needs text or an icon alongside its color treatment.

## Selection and bulk work

Use square checkboxes with neutral borders, carbon fill when selected, and a warm checkmark. The header checkbox must accurately represent none/some/all within its defined scope.

State scope explicitly: “Select this page” is different from “Select all 248 matching records.” Do not silently extend an action from visible rows to every record. Decide and document whether selection survives pagination, sorting, and filtering; show the resulting count clearly.

Show only actions that make sense for the selection and user permissions. If some records cannot participate, explain the count/reason rather than silently skipping them. Preserve recoverability or confirmation appropriate to the action's consequences.

## Sorting, filtering, and navigation

Show the current sort direction and make header sorting keyboard operable. Sort numeric values numerically, dates chronologically, and missing values deliberately. Do not sort formatted amounts as plain strings.

Expose active filters and provide an obvious way to remove them. Differentiate an empty dataset from no matches. If filtering changes the record set, reconcile selection predictably.

Use a clear record link or detail trigger. If the whole row also opens details, keep checkboxes, menus, and links independent so selecting a record does not unexpectedly navigate. Do not add drag handles unless users can meaningfully reorder records.

## Menus and editable cells

Use a neutral ellipsis within a square hit area. A menu uses the warm surface, carbon text, square corners, and the shared overlay shadow. Controls must remain discoverable on touch and keyboard; hover can increase emphasis but cannot be their only means of access.

Use contextual wording: “View record,” “Open history,” “Export measurements,” “Archive,” or “Edit draft,” where those actions exist. Do not add a generic Delete item to every record.

Inline editing is optional. When implemented, use the field and validation behavior in [forms.md](forms.md). Make edit mode explicit; define save/cancel behavior, preserve failed edits, and do not commit destructive changes merely because focus leaves a cell.

## Responsive and large datasets

Preserve column meaning on narrow screens. Use horizontal scrolling for comparison-heavy tables, optionally keeping the identifier column visible. A card/list alternative can suit simple inventories but must retain labels and actions. Do not hide critical units or status columns without an alternative.

Use native table semantics for read-oriented tables. Adopt an interactive grid pattern only when its keyboard behavior is fully implemented. Sticky headers must not obscure focused content. If virtualization is required, preserve coherent navigation and expose total/scope information.

## Exceptions and acceptance

Loading skeletons should retain approximate column geometry without inventing data. Show readable error/retry messages. Use “No equipment matches these filters” for filtered emptiness and distinguish it from an empty inventory.

Review long IDs/names, negative values, large currencies, unknown measurements, dense results, sorting, selection scope, read-only records, touch menus, keyboard focus, and narrow layouts. Confirm that column alignment and hierarchy remain consistent with charts and forms.
