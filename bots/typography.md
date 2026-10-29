# TxIE typography

Typography should make the application feel carefully assembled while keeping repeated reading effortless. This file owns type roles and formatting. See [colors.md](colors.md) for text colors.

## Reference roles and font availability

The source discussion identifies **Owners** for expressive headings and **Phonic** for compact technical labels. These names come from the supplied reference notes; font files, variants, licensing, and browser delivery have not been verified. Do not claim they are installed.

Use three roles, which may be fulfilled by fewer than three actual families:

| Role | Purpose | Candidate family |
| --- | --- | --- |
| Display | Page identity, concise headings, occasional large identifiers | Owners, then a suitable available sans-serif |
| Interface | Field labels, actions, prose, descriptions, readable data | Available neutral sans-serif; inherit the repository's suitable choice |
| Technical | IDs, compact metadata, short uppercase labels | Phonic if available; otherwise an available technical face or system monospace |

Do not classify Phonic as necessarily monospaced based on the screenshot. Tabular figures are a font feature independent of whether all characters have equal width.

```css
:root {
  --txie-font-display: "Owners", Arial, sans-serif;
  --txie-font-ui: system-ui, -apple-system, "Segoe UI", sans-serif;
  --txie-font-technical: "Phonic", ui-monospace, monospace;
}
```

These are fallback stacks, not font-loading code. Substitute verified fonts centrally. Check IDs containing `0/O`, `1/I/l`, and financial and scientific symbols. Avoid loading numerous weights when a small, well-chosen set supports the hierarchy.

## Starting type scale

Values assume the normal 16 px root size. Keep the user's browser font-size preference; do not adopt a 62.5% root merely to reproduce the source website's rem values.

| Role | Size | Weight | Line height | Tracking |
| --- | --- | --- | --- | --- |
| Page heading | 28–36 px | 500–600 | 1.1–1.2 | 0 to .01em |
| Section heading | 18–22 px | 500–600 | 1.25 | 0 |
| Primary KPI | 28–40 px | 500 | 1.1 | 0 |
| Body / entered text | 15–16 px | 400 | 1.45–1.55 | 0 |
| Field label | 14–16 px | 400–500 | 1.4 | 0 |
| Table content | 13–14 px | 400 | 1.4–1.5 | 0 |
| Technical label | 11–12 px | 400–500 | 1.4 | .04–.08em |
| Helper / validation | 13–14 px | 400 | 1.4–1.5 | 0 |
| Button | 14–15 px | 500 | 1.3 | 0 |

Treat this as a coherent starting scale, not a requirement to shrink text to fit. Essential controls should not depend on 10–11 px text. The very small VAST metadata is a compositional reference, not the default for work-critical readings.

Large background identifiers are optional display elements. Size them responsively and use the watermark color. They must never replace a normal readable page title. If duplicative, remove them from the accessibility tree.

## Case and voice

Use sentence case for form labels, descriptions, buttons, errors, menu items, and explanatory text. Use uppercase selectively for short table headers, section indices, equipment IDs where canonical, and compact metadata keys.

Do not apply uppercase transformation to units, user names, filenames, or mixed-case identifiers. Preserve `mm`, `µm`, `nm`, `kW`, and `MPa`. Do not use wide letter spacing on paragraphs or numeric measurements.

The reference headline's 1.04 line height is an optional short display treatment. Do not carry it into multi-line form instructions, tables, or error messages.

## Numeric typesetting

Use tabular figures for values that are compared, aligned, or updated. A sans-serif with tabular digits is appropriate for most costs and measurements; whole-table monospace is unnecessary.

```css
.txie-number {
  font-variant-numeric: lining-nums tabular-nums;
}
.txie-numeric-cell { text-align: right; }
```

Right-align numeric columns and their headers. Left-align names and descriptions. Keep decimals consistent within a column when that precision is justified by the data. Do not add digits that imply greater measurement precision than the source supports.

Use locale-aware formatting for human-readable amounts. Establish the currency in the header or beside the amount. Large KPI abbreviations such as `$3.2M` must have an accessible exact value when precision matters. Avoid count-up animation that passes through fictitious readings.

## Units, dates, and identifiers

- Put a shared unit in the column header or attached input segment when all values share it.
- Keep a visible space between number and unit: `200 mm`, `12.5 µm`. Use nonbreaking spacing where wrapping would separate the pair.
- Preserve significant signs, tolerances, exponents, and superscripts. Do not silently strip `±` or a negative sign.
- Use explicit ranges with minimum/maximum labels where ambiguity is possible.
- Use unambiguous display dates, such as `30 Dec 2026`, or a consistently labeled ISO form in technical contexts. Avoid ambiguous numeric month/day order.
- Keep date-only deadlines separate from timestamps; do not shift a deadline through timezone conversion.
- For audit timestamps, show the applicable timezone or make it clearly available.
- Preserve canonical identifiers exactly. Allow copying without formatting artifacts.

## Empty and exceptional values

Do not display an unknown measurement as `0`. Use `Not measured`, `Unknown`, or an em dash with a clear legend. Distinguish a known zero from missing, invalid, or not applicable. Keep exception text readable; it should not disappear into pale placeholder gray.

## Wrapping and responsive behavior

Allow descriptive text and helper messages to wrap naturally. Avoid truncating units, error explanations, or the identifier needed to distinguish two records. If a table truncates long descriptions, expose the full value through an accessible detail route, not hover alone.

Use fluid heading sizes where helpful, but keep a readable lower bound. Confirm the layout with browser zoom and long content. Alignment should survive alternate font metrics and font loading; reserve reasonable space rather than positioning text by guessed glyph widths.

## Review checklist

Check hierarchy at normal zoom; numeric alignment; correct unit case; distinguishable identifiers; long and multiline content; missing values; currency/date consistency; and fallback-font behavior. Finalize Owners/Phonic use only after actual files and permissions are confirmed.
