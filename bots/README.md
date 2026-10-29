# TxIE digital brand and interface guides

Version: 0.1 · 27 October 2026 · Status: implementation baseline

These files define the browser experience for the Texas Institute for Electronics (TxIE) application. They are intended for designers, engineers, and coding assistants working on procurement, equipment, facilities, and metrology interfaces. Read this file and `brand.md` before changing an interface. Load the relevant component guide before implementation.

The intended feeling is: **“This system is carefully made. I can understand what I am seeing, inspect it closely, and act with confidence.”**

## Guide map

| File | Owns | Read when |
| --- | --- | --- |
| [brand.md](brand.md) | Emotional intent, visual principles, composition, voice, general interaction | Starting any interface work |
| [colors.md](colors.md) | Canonical palette, semantic tokens, surfaces, state colors, material colors | Styling any component or visualization |
| [typography.md](typography.md) | Font roles, hierarchy, labels, numbers, units, formatting | Adding or changing text |
| [3Dmodels.md](3Dmodels.md) | Spatial assets, geometry, lighting, projection, camera transitions, overlays | Working on wafers, facilities, tools, or spatial inspection |
| [charts.md](charts.md) | Analytical layouts, data encodings, selection, legends, chart behavior | Building dashboards or visualizing measurements |
| [tables.md](tables.md) | Record hierarchy, density, selection, sorting, actions, numeric columns | Presenting or comparing records |
| [forms.md](forms.md) | Input geometry, grouping, field states, validation, engineering entry patterns | Collecting or editing information |

## What is settled and what remains provisional

**User-established direction:** digital-only branding; warm off-white backgrounds; carbon text; restrained orange; square interface geometry; precise engineering character; readable spacing; selective soft elevation; technical models inspired by the turbine reference; material and spatial transitions inspired by VAST; SVG and mathematical geometry preferred where practical, with canvas/WebGL allowed.

**Implementation defaults proposed in this guide:** numerical spacing, type sizes, semantic color extensions, motion durations, line widths, and control dimensions. Use them consistently as a starting system, then adjust after viewing actual content and interactions. Changes should update the owning guide and dependent implementations together.

**Not verified:** availability or licensing of the reference fonts; current application structure; exact source code behind the video references; existing token names in the repository; dark-mode requirements. This package describes intended behavior, not an audit of an installed application.

## Source record

This baseline synthesizes the supplied `Metrology Interface Brand Design.pdf`, the following references, and the subsequent table/form discussion. Earlier-chat retrieval was unavailable; the visible project history supplied additional context on procurement forms and the Svelte stack.

| Reference | Intended contribution |
| --- | --- |
| `sample.png` — VAST Haven-1 | Brand atmosphere, warm palette, typography roles, perimeter information, restrained technical markings |
| `model.mov` | Material light, changing reflections, continuous reorientation, interior inspection |
| `turbine.mov` | Pale technical geometry, visible construction, process overlays, spatial grounding |
| `charts.jpg` | Individual chart spacing, concentrated color, direct labels, highlighted callouts |
| `dashbaord.jpg` — filename as supplied | Overall summary hierarchy, aligned analytical panels, navigation placement |
| Table screenshot, 27 October 2026 at 11:55 | Horizontal rhythm, row selection, compact actions |
| `forms.png` | Persistent labels, clear grouping, explicit absence, local validation |

Reference media are not bundled in this folder. Their visual ideas are translated into written rules; exact UI copies are not required.

## Rules for developers and coding assistants

1. Inspect the repository's current components and instructions before editing. The discussed stack is Svelte 5, Tailwind CSS, shadcn-svelte, and Lucide; confirm actual dependencies in the project.
2. Reuse existing primitives. Map these semantic tokens into the theme once rather than scattering literal colors across components.
3. Preserve existing data contracts and working behavior unless the task requests changes. Branding does not authorize invented backend capabilities.
4. Apply geometry through component styles. Do not use a global `* { border-radius: 0 }` reset that damages native controls, diagrams, or third-party content.
5. Treat forms, tables, charts, and models as one system. Share type roles, color meanings, action hierarchy, and focus behavior.
6. Keep business logic independent of appearance. A value is not approved because it is green; a record is not locked because it displays a lock icon.
7. State unknown information explicitly. Do not fabricate measurements, approval history, savings, live updates, or autosave success.
8. If an exception is necessary, document the reason in the relevant guide or implementation notes. Preserve readability and task completion.

## Decision precedence

Current explicit user requirements take precedence over this baseline. Within this package, `colors.md` owns color values and `typography.md` owns type rules. Component guides own component behavior. The PDF is source context; the refinements here resolve its conflicting extrapolations.

Do not revive the PDF's absolute bans on soft shadows, mandatory reticles, compulsory count-up animations, or universal zero-gap layouts. Do not treat its suggested rendering architecture or exact timing as observed facts.

## Before shipping

- Check realistic long names, large amounts, negative readings, missing values, and small screens.
- Inspect empty, loading, error, selected, focused, read-only, and disabled states where applicable.
- Confirm keyboard navigation, visible focus, readable contrast, and motion preferences.
- Confirm data units, scales, date interpretation, and source precision.
- Check that selection, warning, failure, and approval remain distinguishable.
- Verify that implemented actions and save messages correspond to real application behavior.
- Review the finished composition, not only individual tokens.

## Open decisions

Confirm font files and permitted use; finalize brand spelling/logo assets; map tokens to the installed theme; establish domain-specific status vocabularies and measurement scales; measure spatial rendering performance; decide whether dark mode is needed. Use the documented light theme until a separate dark theme is designed.
