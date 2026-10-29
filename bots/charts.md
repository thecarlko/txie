# TxIE charts and analytical dashboards

Charts should help users compare, locate, and inspect engineering information. Read [colors.md](colors.md) for palette roles, [typography.md](typography.md) for numeric formatting, and [3Dmodels.md](3Dmodels.md) for spatial overlays.

## Reference translation

Keep the spacious plot composition, direct labeling, selected-region emphasis, and localized callouts from `charts.jpg`. Keep the aligned summary/analysis hierarchy from `dashbaord.jpg`. Translate the pure-white cards, rounded controls, and blue brand identity into warm surfaces, square controls, carbon text, and restrained orange.

The reference graphics are visual examples, not verified analytical specifications. The Australia thermal treatment does not establish what its within-region variation measures. Its ribbon widths and percentages do not establish a meaningful procurement model. Select chart geometry from the real question and data.

## Dashboard structure

Place a concise page title and relevant summary values above the analytical area. Give each panel a title, optional explanation, stable action position, plot area, and nearby legend or scale. State filters, time range, sample count, or update time when needed to interpret the result.

Use a shared aligned grid. Continuous ruled panels suit closely related measures; modest gutters separate distinct subjects. Start around 24–32 px panel padding on wide screens and 16–20 px on narrow screens. Do not force a 2×2 layout when a plot requires more width.

Resting panels are flat. Overlay callouts may cast a soft shadow. Square corners apply to panel controls and labels; curves that represent data remain curves.

## Choose a truthful encoding

| Question | Suitable starting form | Guardrail |
| --- | --- | --- |
| How do categories compare? | Bar/dot plot or table | Preserve a clear quantitative axis |
| How does a value change over time? | Line, points, or step chart | Show actual timestamps and appropriate interpolation |
| How much capacity is used? | Linear progress/bullet chart; optional gauge | Define capacity or target and show overrun |
| Where is a measurement high or low? | Spatial field or region map | State units, bounds, missing data, and interpolation |
| How do values deviate from a nominal target? | Diverging scale or tolerance plot | Show the meaningful center and limits |
| How does quantity flow between stages? | Flow diagram when supported | Width must encode an actual quantity |
| What stage is a request in? | Stage list, status count chart, or timeline | Do not imply continuous flow without supporting data |

## Color scales

Use neutral baselines and selectively emphasize the active series or region. Color roles must remain consistent across related charts.

- **Categorical:** distinct groups with labels; do not imply ranking unless intended.
- **Sequential:** increasing magnitude with an ordered, readable progression.
- **Diverging:** departures below and above a meaningful center, such as nominal deviation.
- **Status:** actual conditions such as outside tolerance, with explicit labels and boundary definitions.

Avoid a universal blue–green–yellow–orange–red ramp. Choose a scale suited to the task and examine perceptual ordering. Interpolation in OKLCH is an implementation option, not proof that a scale is truthful or readable.

Keep compared plots on the same domain when comparison requires it. If users rescale, expose that change. Show a legend with units, endpoints, and meaningful thresholds. Missing values must not share the lowest-value color.

## Four reference patterns

### Gauge

Retain the strong central value and nearby breakdown when a bounded measure exists. Use square arc ends if consistent with the geometry, restrained gaps, and a readable target label. Do not add degree ticks unless they correspond to the quantity. A currency total without a meaningful capacity often works better as a KPI plus bars.

### Spatial heatmap

Keep inactive regions quiet and bounded. Clip overlays to the correct geometry. Show exact values on selection and preserve labels for the surrounding context. If a region has only one aggregate value, use one region fill rather than an invented continuous thermal field. Spatial interpolation requires a valid method and visible distinction from measured sample locations.

### Layered ribbon

Use layers only when each has an explicit meaning, such as known categories or a defined uncertainty interval. Do not add opacity bands merely to make a stage transition look scientific. Label checkpoints and define what width, position, and percentages represent.

### Trend with direct labels

Keep direct labels near the series ends where they remain readable. Use restrained line weight, a clear selected point, and a vertical guide where useful. End labels may be square flags. Prevent collisions and provide a legend alternative on small screens.

Use linear or step interpolation when it reflects the data. Smoothing must not invent peaks, crossings, or apparent measurements. Show gaps for missing observations unless continuity is justified. If showing a delta such as `+1.2%`, identify the comparison baseline.

## Inspection behavior

Hover can reveal a quick value; click/tap or keyboard selection should support persistent inspection. Keep selection distinct from warning/error state. If the data already uses orange, emphasize selection with a carbon outline, shape, or crosshair rather than changing the value's color.

Callouts can use carbon backgrounds, warm text, square corners, and the shared overlay shadow. Include the point/region identity, value, unit, and time or comparison context. Avoid an orange stripe on every tooltip by default. Keep labels inside the viewport and away from important marks when possible.

Interactive overlays must be keyboard reachable and dismissible. Provide a tabular route to exact values for complex charts. Do not announce continuous hover updates unnecessarily to assistive technology.

## Axes, labels, and density

Use faint warm gridlines and stronger axis/label contrast. Keep tick labels readable at normal zoom. Abbreviated axes may coexist with full values in inspection details. Label logarithmic, normalized, or cropped scales explicitly. Use honest baselines, particularly for bars where length encodes magnitude.

Subsample visual marks when needed while preserving access to exact data and disclosing aggregation. Prevent dense labels from overlapping. Responsive layouts may stack panels or move legends; they must not remove the units or scale needed to interpret the plot.

## Loading and exceptions

Keep the plot's geometry stable while loading. Distinguish `No measurements`, `No matching results`, `Unavailable`, and `Loading`. Do not show a zero-valued chart as a placeholder. On refresh failure, label retained data as stale if it remains visible. Use actual update times rather than a decorative “Live” indicator.

## Acceptance checks

Confirm chart choice against the question; scale and units; thresholds and missing values; exact-value access; label collisions; keyboard/touch behavior; selection vs severity; consistent comparison domains; and performance with realistic data. Verify that no visual effect fabricates evidence.
