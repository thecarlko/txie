# TxIE forms

Forms should feel like well-organized engineering worksheets: clear requirements, comfortable spacing, accurate state feedback, and little unnecessary writing. Preserve the reference's persistent labels, section header, explicit absence choice, and adjacent validation. Apply [colors.md](colors.md), [typography.md](typography.md), and [brand.md](brand.md).

## Purpose and information burden

For procurement, collect enough information for FAB leadership to understand the capability gap, proposed solution, timing, ownership, and decision impact. Use structured controls wherever they reduce repetition or improve comparison. Earlier user direction uses a shared proposal workflow rather than a tier chooser. Required fields and gates still come from actual domain rules.

Ask for information at the stage when it can reasonably be known. A proposal should not appear invalid simply because a final vendor quote does not yet exist when the workflow permits estimates. Make uncertainty explicit rather than forcing invented precision.

## Section structure

Use plain, unfilled section headings aligned with the labels and controls below them. Legends have no horizontal padding, background band, or border by default. A section may read `01 / Equipment requirements`, followed by “Define the capability and operating range the equipment must support.” Keep guidance close to the title, not stranded at the far edge of a wide form.

Apply the warm canvas once at the form or page surface; fieldsets and field groups remain transparent. Let layout gaps provide spacing without stacking extra margins or line breaks. A header band is an optional treatment for a distinct panel only when its heading and body share the same inset.

Number major sections if a stable sequence helps orientation. Use line icons only when they add recognition. Avoid nesting a card around every field. Keep optional details in clearly named disclosures, while ensuring hidden errors can be found and revealed.

An illustrative proposal sequence is:

1. Request and ownership: purpose, requester, facility, owners.
2. Capability need: required capability, existing alternatives, the specific gap.
3. Technical requirements: parameters, ranges, units, required/preferred distinction.
4. Timing and impact: needed date, dependencies, affected work/programs.
5. Budget and evidence: amount/range where known, estimate basis, attachments.
6. Review: concise summary of entries, uncertainties, and missing required items.

This is a grouping proposal, not an authoritative backend schema. Preserve the application's actual category keys; the prior project direction treats budget keys as canonical where related context categories must match.

## Layout and dimensions

| Relationship | Starting value |
| --- | --- |
| Control minimum height | 44–48 px |
| Horizontal control padding | 12–14 px |
| Label to control | 6–8 px |
| Control to helper/error | 6–8 px |
| Between field groups | 24–32 px |
| Between major sections | 32–40 px |

Use two columns for related moderate-length fields, three only for short closely related values, and full width for substantive descriptions or requirements tables. A short numeric reading should not occupy the same width as a technical justification.

Use square field boundaries and the stronger control-border token. Do not rely on a faint table rule to identify an input. Keep the canvas warm; overlays may use a warm surface with the shared shadow.

Reflow to a single logical column on narrow screens. Avoid fixed screen-height form containers that clip content or create nested scrolling on mobile. Let helper/error text expand naturally. Keep action areas from covering fields when a software keyboard opens.

## Labels and guidance

Use sentence case, persistent labels, and readable input text. Uppercase technical type belongs to section indices, IDs, and compact metadata. Mark optional fields explicitly when most fields are required; otherwise use a consistent required convention with an explanation.

Placeholders are examples, not labels or entered values. State important format rules outside the field. Keep helpers specific: “Include the measurement range and required resolution” is more useful than “Enter details.”

Associate labels and descriptions programmatically with their controls. Give grouped choices a clear group label. Avoid relying on visual proximity alone.

## Field state system

| State | Visual and behavioral treatment |
| --- | --- |
| Empty | Neutral border, persistent label, useful helper/example |
| Hovered | Slightly stronger boundary |
| Focused | Clear carbon outline; optional orange detail; no layout shift |
| Filled | Normal carbon value, without automatic green decoration |
| Invalid | Error boundary, explanatory text, and icon where helpful |
| Estimated | Explicit basis label; amber only if attention is needed |
| Unknown / not applicable | Explicit mutually exclusive choice where allowed |
| Read-only | Readable value and a reason where relevant |
| Disabled | Unavailable control plus explanation, such as “Select a facility first” |

Keep the main label carbon during errors. Use a specific red message and boundary rather than making the entire section red. Focus must remain visible when a field is invalid. Selected options use the shared control/selection system; error red and interaction orange remain distinct.

Blank, zero, unknown, not measured, not applicable, and estimated are separate meanings. Preserve them in the data model where the workflow requires those distinctions.

## Engineering entry patterns

### Values, units, and ranges

Pair numeric inputs with fixed or selectable units. Keep the unit visible during entry and review. Use separate minimum/maximum fields for ranges. Show allowed limits and their source where known. Do not silently change the magnitude when a unit selection changes; conversions must be predictable and validated.

Preserve user input while editing. Do not aggressively reformat decimals or separators on every keystroke. Distinguish a parse failure from a domain-limit violation. Avoid precision beyond what the source supports.

### Requirements and alternatives

Use addable rows for parameter, requirement, unit, and required/preferred priority. Offer structured choices for common requirements plus an explicit custom entry. Use a short explanation field for why existing capability is insufficient; avoid a large undirected essay box.

### Searchable records and multi-selection

Show both identifier and readable name when selecting equipment, locations, owners, or programs. Support keyboard navigation and accessible selection controls. Allow multi-select chips to wrap. If custom program names are permitted, provide an explicit add action and place them in the appropriate custom/other category; do not silently alter canonical keys.

Prevent accidental duplicates, make removal easy, and keep the selected state understandable without color. Do not bind the same keyboard gesture to both adding a chip and submitting the entire form.

### Dates and dependencies

Use one coherent date control with an unambiguous display and a keyboard entry route where supported. If the requested default is three months from today, calculate three calendar months from the user's date, not a fixed 90 days. Use the installed date library's calendar behavior and handle month-end bounds. Do not overwrite a saved value with a default when reopening a draft.

When facility selection controls available bays, explain the dependency. If an upstream change invalidates a downstream choice, make the change visible and avoid silently losing unrelated input.

### Attachments

Show filename, type/size as useful, upload progress, success/failure, and removal. Allow retry. Do not mark the form saved while an attachment needed for completion is still uploading. Only support file actions that actually exist.

## Validation timing and messages

Validate after leaving a field or attempting to continue. Once an error is shown, update it as the user corrects the entry. Avoid repeatedly flagging a partially typed number. Validate relationships such as minimum/maximum together, and repeat authoritative validation at the appropriate server boundary.

Messages should explain the correction:

- “Enter a maximum greater than or equal to the minimum.”
- “Select a unit for this measurement.”
- “Choose a facility before selecting a bay.”
- “Enter an estimate or select ‘Not yet determined’.” — only when that option is allowed.

For multiple errors, provide a summary linked to the affected fields and a predictable focus strategy. Expand collapsed sections that contain errors. Preserve entered data after validation or submission failure. Announce meaningful status changes without interrupting every keystroke.

## Saving, completion, and approval

Maintain separate state for entry completeness, validation, unsaved changes, save requests, saved drafts, and formal approval. Only show “Draft saved” after successful acknowledgement. On failure, retain local entries and provide retry. If concurrent edits are supported, surface conflicts rather than silently overwriting them.

Offer a clear primary action such as “Review proposal” or “Submit proposal,” a secondary “Save draft” when supported, and a quiet cancellation route. Warn about losing unsaved work when appropriate. Do not label a completed form “Approved.”

Any read-only approved snapshot must be backed by actual application behavior. Provide revision actions only if implemented. The design guide does not create audit guarantees.

## Acceptance checks

Review keyboard and touch operation; labels and focus; valid/invalid/unknown combinations; dependent fields; unit conversions; date defaults; large custom selections; long helper text; mobile flow; failed uploads; failed saves; and actual required-field rules. Confirm that engineers can communicate the necessary evidence through structured entries without excessive prose.
