# TxIE color system

This file owns palette values and semantic color roles. See [brand.md](brand.md) for intent and [charts.md](charts.md) for data scales. Values below define a light theme. A dark theme requires a separate design pass.

## Foundation

The user supplied the following source colors from the VAST reference. Retain their exact notation; approximate hexadecimal conversions in the original PDF are not authoritative equivalents.

| Source role | Value | Application |
| --- | --- | --- |
| Canvas | `oklch(0.9896 0.0106 100.82)` | Main warm background |
| Signal orange | `oklch(0.6781 0.2134 36.14)` | Selected context, active markers, small accents |
| Carbon ink | `oklch(0.2923 0.0061 258.36)` | Primary text and strong surfaces |
| Reference carbon approximation | `#2A2C2F` | Supplied reference text color; use the canonical ink token in code |
| Warm muted gray | `#897F75` | Nonessential markings; use cautiously for small text |
| Pale identifier gray | `#ECE8E3` | Decorative large identifiers, very subtle structural detail |

Pure white is not the standard panel or input background. Blue is not the application brand color. Blue can still encode a measurement category or physical process when its role is explicit.

## Proposed semantic token baseline

The extensions below are design defaults. Verify them in the rendered application with actual fonts, sizes, opacity, and backgrounds. Do not claim accessibility conformance from the palette alone.

```css
:root {
  --txie-canvas: oklch(0.9896 0.0106 100.82);
  --txie-surface: var(--txie-canvas);
  --txie-surface-subtle: #f6f3ed;
  --txie-surface-header: #f2efe9;
  --txie-surface-selected: #f5ede2;

  --txie-ink: oklch(0.2923 0.0061 258.36);
  --txie-ink-secondary: #665f57;
  --txie-mark-muted: #897f75;
  --txie-watermark: #ece8e3;
  --txie-on-dark: var(--txie-canvas);

  --txie-rule-subtle: #e4dfd9;
  --txie-rule-strong: #d5cfc7;
  --txie-control-border: #897f75;
  --txie-focus: var(--txie-ink);
  --txie-accent: oklch(0.6781 0.2134 36.14);

  --txie-error: #a8322d;
  --txie-error-surface: #f8e9e5;
  --txie-warning: #7a520e;
  --txie-warning-surface: #f6efdc;
  --txie-success: #286047;
  --txie-success-surface: #eaf1e9;

  --txie-shadow-overlay:
    0 1px 2px rgb(42 44 47 / 0.12),
    0 10px 24px -6px rgb(42 44 47 / 0.18);
}
```

`--txie-control-border` is intentionally stronger than a table separator. Earlier discussion proposed the light rule color for input outlines; this consolidated baseline strengthens outlines that users rely on to identify editable controls. Decorative rules can remain faint.

Map these values into the installed component theme: background/card/popover to warm surfaces, foreground to ink, primary to ink with warm foreground, border to a context-appropriate rule, ring to focus, destructive to error. Do not assume the framework's token syntax or version; inspect the installed configuration first.

## State meanings

| Role | Treatment | Required companion |
| --- | --- | --- |
| Brand emphasis | Small orange marker or detail | Clear surrounding hierarchy |
| Selected record | Warm selected surface, carbon checkbox, orange leading marker | Selection semantics and/or label |
| Keyboard focus | Visible carbon outline; optional orange detail | Actual focus target |
| Error | Red boundary/message with pale error surface where useful | Specific correction and icon/text |
| Warning | Dark amber text and pale amber surface | Explanation of uncertainty or attention needed |
| Success/approval | Dark green with a subdued surface | Explicit domain label and real status |
| Unknown/inactive | Neutral text/surface | “Unknown,” “Not measured,” or the actual state |

Selection is not failure. Orange should not simultaneously mean active record and critical anomaly in the same view. Use a separate selection outline or shape if a data scale already contains orange.

Unknown information is not automatically a warning. Use amber when uncertainty affects a decision or requires action. Empty fields and pending work can remain neutral.

## Contrast and legibility

Use 4.5:1 as an internal minimum target for ordinary text and 3:1 for essential control boundaries and graphical indicators against adjacent surfaces. Check actual rendered combinations before release. Keep required information readable even when a control is disabled or a record is archived.

The pale watermark and light separator tokens are decorative. Do not use them for required labels, focus outlines, or a graph's only meaningful distinction. Avoid warm-muted gray at tiny sizes. Signal orange is not automatically suitable for small text or for white text on an orange button. Use carbon text/actions unless a particular accent combination has been checked.

Do not reduce the opacity of an entire row or form section to represent one unavailable action. Do not rely on color alone: use labels, line patterns, icons, shapes, or placement as appropriate.

## Data color is a separate layer

Categorical colors identify groups; sequential scales encode magnitude; diverging scales encode deviations around a meaningful center. Keep these roles separate from workflow status tokens.

Candidate data accents from the reference discussion include cobalt `#2563EB`, cyan `#38BDF8`, green `#10B981`, amber `#F59E0B`, and the brand orange. They are illustrative ingredients, not a mandatory rainbow ramp or an approved accessible category set. Select and evaluate a palette for each analytical task, preserving its meanings across related views.

Never assign green to a series and then imply that series is approved unless approval is what the data represents. Missing measurements need a distinct neutral or patterned encoding rather than the low end of the scale.

## Materials and illumination

Model surfaces may use warm highlights, cool shadows, copper, brass, or silicon-inspired variation. A starting neutral material ramp is `#FFFDF9`, `#ECE8E3`, `#C3C8CD`, `#6F767D`, and `#2A2C2F`. These values describe illumination, not approval or selection.

Keep material shading and measurement overlays separable. Lighting must not make an identical measurement appear to have different severity on two faces. Use a flat analytical mode when exact comparison matters.

## Usage checks

- Keep strong color concentrated around active information; do not enforce an arbitrary percentage of the viewport.
- Preserve the warm canvas in tables, forms, and overlays.
- Confirm that semantic states remain distinguishable when hue is unavailable.
- Check selected + focused + invalid combinations, not only isolated states.
- Preserve one scale and legend across compared datasets unless a changed scale is explicitly disclosed.
- Do not introduce a second local palette inside an individual component.
