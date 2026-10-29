# TxIE spatial models and inspection

Use this guide for wafers, equipment, facility views, sectioned objects, and spatial measurements. Read [brand.md](brand.md), [colors.md](colors.md), and [charts.md](charts.md) alongside it.

## Reference intent

`turbine.mov` establishes pale technical geometry, readable internal construction, restrained fine edges, grounded contact shadows, and expressive process overlays. `model.mov` establishes material light, changing reflections, a coherent exterior/interior transition, and anchored inspection points. `sample.png` contributes a quiet object stage, stable perimeter information, and restrained orientation marks.

The supplied recordings reveal the visual result. They do not establish exact projection matrices, CSS classes, source rendering layers, spring constants, or shader algorithms. The PDF's six-layer rendering scheme is a proposal, not a verified implementation.

## Model appearance

Keep the structural object legible in neutral tones. Use different face values, occlusion, section boundaries, and a restrained contour hierarchy to explain construction. Reserve strong color for selected context, a physical process, a measurement overlay, or meaningful material appearance.

Start with a narrow light structural palette for complex technical drawings. Increase contrast where important parts become indistinguishable. A faint object that looks elegant but hides the selected component is not successful.

Use the neutral material ramp in `colors.md`. Copper or brass accents may identify actual material or establish a limited visual highlight. Do not recolor unrelated hardware orange simply to match the brand.

## Geometry and rendering strategy

The preferred direction is mathematical geometry rendered through SVG where it gives crisp, interactive, manageable shapes. Canvas or WebGL may support dense measurements, continuous fields, effects, or geometry that exceeds a practical SVG budget.

Choose rendering technology by content and measured performance. A complete model does not need every layer below:

| Responsibility | Possible rendering approach |
| --- | --- |
| Background and static UI | CSS / HTML |
| Structural outlines and moderate geometry | SVG |
| Dense continuous fields or many marks | Canvas or WebGL |
| Contact shadows and lighting | SVG, CSS, canvas, or WebGL as appropriate |
| Accessible controls and descriptive text | HTML, with SVG for spatial anchors |

If layers are combined, share projection, viewport, scale, selected IDs, and camera state. Do not let the canvas heatmap and SVG outline drift during resize or animation. Consider clipping and depth order: a simple front/back stack may be insufficient for correct occlusion through a cutaway.

Prefer orthographic or weak-perspective presentation for comparison and technical inspection. An orthographic view still foreshortens surfaces; provide a calibrated top or section view when users need exact planar readings. Any more expressive overview must preserve a reliable route to the measurement view.

## Lines and surfaces

- Give silhouettes greater visual strength than internal edges.
- Use fine internal construction lines without drawing every tessellation boundary.
- Start around 0.75–1 px for visible internal lines and 1–1.25 px for major contours at normal display scale; adjust to object density and zoom.
- Very faint or subpixel lines may be used decoratively but must not carry essential distinctions.
- Decide which SVG strokes stay screen-sized during zoom and which represent actual physical geometry.
- Use a heavier section edge or restrained hatch to distinguish cut material from an exposed surface.

Soft ambient and contact shadows are permitted. They explain where the object sits and how parts overlap. Rounded physical parts remain rounded even though application controls are square.

## Lighting and analytical color

Use a stable light model: coherent warm highlights and cooler shadow values. Reflections should change plausibly with orientation. Avoid uncontrolled glare that obscures geometry or labels.

Keep material shading independent of measurement color. Provide a flat analytical rendering when a gradient must be read quantitatively. Apply the same scale and legend to equivalent values. Do not imply a measured field where only a conceptual flow illustration exists; label illustrative or simulated content clearly.

Missing measurement regions need a distinct pattern or neutral treatment. Do not interpolate over missing areas without an explicit data-processing basis.

## Camera and state transitions

Maintain a stable object identity across overview, cutaway, isometric, and top views. A typical transition is: retain selection, move toward the target inspection pose, reveal the relevant section/overlay, and settle labels into readable positions. Sequence or overlap these changes as needed for clarity.

Suggested duration is 450–800 ms for a deliberate reorientation. Avoid bounce, camera spinning, or dramatic travel unrelated to the task. The PDF's exact angles are not universal requirements. Define axes, orientation, and notch direction according to the actual dataset.

Transitions must be interruptible and support reduced motion. Preserve the selected wafer, die, tool, or facility region. Avoid restarting the camera when a user only changes a numeric filter. Provide explicit reset and view-mode controls.

## Spatial annotations and controls

Use compact square anchors connected to actual projected coordinates. Prioritize selected or relevant annotations, resolve collisions, and prevent labels from leaving the viewport. Hide or differentiate occluded anchors so they do not appear attached to the wrong surface.

A selected anchor may open a carbon inspection tooltip with warm text and selective elevation. Provide units, identifier, value, and status as applicable. Interactive content belongs in a focusable popover or panel, not an inaccessible hover-only tooltip.

Keep primary controls in stable HTML positions. Controls drawn onto an isometric plinth can be a visual enhancement, but must retain clear hit areas, keyboard operation, labels, and an equivalent conventional control when needed. Custom cursors must not be required to understand or operate the view.

Reticles are optional. Use a degree ring only when orientation or rotation is meaningful. Use a scale bar only when its mapping is valid. Decorative ticks must not suggest a calibrated instrument.

## Performance and fallback

Reuse geometry, avoid unnecessary full-scene reconstruction, and limit work during pointer movement. Use detail levels where helpful and profile representative dense data on target devices. Do not assume SVG is always faster than WebGL or vice versa.

Keep labels and controls usable while heavy content loads. Offer a static or simplified view if rendering fails. Provide a textual/table route to essential values and selection so the model is not the sole means of accessing data.

## Acceptance checks

Check projection alignment during resize; layer clipping and occlusion; dense-label collisions; selection persistence; pointer and keyboard interaction; missing data; meaningful scale; reduced motion; error/loading states; and a realistic high-density scene. Confirm that material effects do not distort the reading of measurements.
