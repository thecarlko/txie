# TxIE brand direction

Read [README.md](README.md) for scope and source status. Color values live in [colors.md](colors.md); type rules live in [typography.md](typography.md).

## Purpose and emotional target

TxIE is a browser-based engineering workspace for understanding equipment, facilities, procurement decisions, and measurements. Its appearance should communicate careful construction, technical credibility, and calm control. The user should be able to move from an overview to an exact record without losing orientation.

The visual system supports four feelings:

| Feeling | Interface evidence |
| --- | --- |
| Confidence | Clear provenance, readable numbers, explicit states, reliable save feedback, visible history where implemented |
| Precision | Consistent alignment, meaningful units, disciplined type, exact selection targets, restrained geometry |
| Spatial understanding | Stable landmarks, coherent transitions, anchored callouts, useful relationships between diagrams and records |
| Calm authority | Quiet surfaces, selective emphasis, concise instructions, predictable controls |

These are design goals, not claims that a palette alone improves performance or eliminates eye strain. Trust depends on actual behavior and accurate information.

## Visual signature

Use a warm off-white canvas, cool carbon text, warm neutral structure, and sparse signal orange. Interface surfaces have square corners and fine rules. Important information gains emphasis through position, contrast, spacing, and weight before additional decoration.

Technical character comes from credible detail: a properly aligned measurement column, an explicit unit, a stable identifier, or a meaningful scale. Reticles, ticks, crosshairs, and section marks must serve orientation or measurement. Avoid distributing them across every panel solely to make the application look technical.

Use material richness inside models and meaningful data color inside visualizations. The surrounding interface provides a quiet frame. Copper, silicon reflections, and soft contact shadows can coexist with square UI controls.

## Composition by task

### Overview and analytical workspaces

Place page identity and essential summary information first. Align analytical panels to a consistent grid. Use continuous divided surfaces for closely related information and modest gaps for distinct tasks. Preserve common title, control, plot, and legend positions across panels.

Avoid excessive nesting of bordered cards. A section heading, spacing, and a rule often provide enough structure. Do not force all panels to equal height when their contents differ substantially.

### Spatial inspection

Give the object a clear central stage. Keep supporting information at stable edges where space permits. A large subdued identifier can establish context on an overview, but omit it when it interferes with measurements or dense controls. Reflow perimeter information on small screens; it must not overlap the object.

### Tables and forms

Use strong alignment, predictable field/row geometry, and readable labels. Precision should reduce the work of comparing or entering information. Do not inherit promotional-page text sizes or empty space without adapting them to repeated daily tasks.

## Surface, line, and elevation grammar

- Base content is visually flat and grounded in the page.
- Use 1 CSS px rules for ordinary UI structure. Stronger rules separate major groups sparingly.
- Use square corners for application cards, inputs, buttons, menus, badges, and selection controls.
- Natural geometry remains natural: wafers, gauges, model parts, and meaningful circular markers can be curved.
- Use soft contact/ambient shadows for menus, dialogs, inspection callouts, and spatial depth.
- A shadow should explain overlap, contact, or elevation. Avoid a shadow on every resting panel.
- Chamfers and decorative corner brackets are optional exceptions, not required brand motifs.

## General actions and icons

Primary actions use a carbon-filled square button with warm light text. Secondary actions use neutral borders and surfaces. Quiet actions use text with an optional directional icon. Orange marks active context sparingly; it is not necessary to fill every primary button orange.

Use a consistent outline icon family, with Lucide as the discussed implementation choice. Start around 16–18 px for inline controls and 20 px where visual prominence is needed. Align icons optically with text. Give icon-only buttons accessible names and usable hit areas larger than the glyph where necessary.

Use labels that describe the action: “Review proposal,” “Save draft,” “Export measurements,” “Open history.” Destructive actions need explicit wording and appropriate recovery or confirmation behavior according to their consequences.

## Motion

Motion should clarify a change in state or spatial relationship. Default proposals:

| Interaction | Starting duration | Intent |
| --- | --- | --- |
| Color/border feedback | 100–160 ms | Confirm direct interaction |
| Menu, tooltip, disclosure | 140–220 ms | Explain appearance or expansion |
| Small layout transition | 180–280 ms | Preserve grouping |
| Deliberate spatial reorientation | 450–800 ms | Preserve object continuity |

Use a controlled ease-out for small transitions. Spatial motion should settle without playful bounce. These timings are proposed defaults, not extracted source values. Long transitions must remain interruptible.

Do not animate measurement digits through fabricated intermediate values. Do not redraw all structural borders on every navigation. Avoid ongoing ornamental motion during reading. Respect reduced-motion preferences with immediate state changes or a brief fade that preserves all information.

## Voice and microcopy

Write like a helpful engineering colleague: specific, calm, and concise. Use sentence case for narrative text and actions. Keep technical identifiers intact. Explain what happened and what the user can do next.

| Situation | Preferred example |
| --- | --- |
| Missing input | “Select a facility.” |
| Invalid relationship | “Maximum must be greater than or equal to minimum.” |
| Unknown value | “Not yet determined” |
| Failed save | “Changes could not be saved. Your entries are still here. Try again.” |
| No matching records | “No equipment matches these filters.” |
| Successful draft save | “Draft saved” — only after acknowledgement |
| Locked state | “Approved revision. Create a revision to make changes.” — only if supported |

Avoid vague “Something went wrong” messages when a more useful explanation is known. Avoid celebratory language for ordinary administrative actions. Avoid threatening language for recoverable input errors.

## Brand and workflow boundaries

Procurement screens should help engineers supply decision-useful information with minimal repetitive writing. Prefer structured requirements, searchable selections, optional details, and explicit uncertainty. Earlier project direction treats proposals through one shared workflow rather than asking engineers to choose a tier. Actual stage names and authorization rules must come from the application/domain specification.

Keep draft completion, save status, technical verification, and formal approval visibly distinct. Never promise immutable history, automatic saving, or live telemetry solely through visual design.

## Review questions

Can the user locate the primary object or task immediately? Are important values readable without hovering? Is orange doing one clear job in this context? Does every decorative mark earn its place? Does motion explain something? Can the same task be completed with a keyboard and without motion? Does the interface remain coherent when records are incomplete or unusually long?
