# Floor plan furniture planner (Svelte 5)

Bird's-eye view of a building, click a room to zoom in, add furniture as rectangles, drag them to the exact millimetre. Every room keeps a live directory of what's in it, and the plan shades where a selected piece would fit given everything else and the clear floor each piece needs.

Requires Svelte 5.20 or later (`$props.id`, `Tween`, `prefersReducedMotion`). No other dependencies.

## Install

Copy this folder to `src/lib/floorplan/` and use it from a route:

```svelte
<!-- src/routes/plan/+page.svelte -->
<script>
  import { FloorPlanApp } from '$lib/floorplan';
  import { marenHouseFlat12, marenHouseFlat12Layout } from '$lib/floorplan/sample-building.js';
</script>

<FloorPlanApp building={marenHouseFlat12} initial={marenHouseFlat12Layout} />
```

Run the logic tests with `node --test src/lib/floorplan/` (or point Vitest at `floorplan.test.js`).

## Files

| File | What it is |
| --- | --- |
| `FloorPlanApp.svelte` | Canvas plus panel plus saving. Start here. |
| `FloorPlan.svelte` | The SVG canvas: camera, dragging, snapping, keyboard. |
| `RoomDirectory.svelte` | The side panel: rooms, contents, add form, editor. |
| `plan.svelte.js` | The store. Rooms, furniture, conflicts, placement, undo. |
| `camera.svelte.js` | viewBox tweening and screen-to-world conversion. |
| `geometry.js` | Pure geometry. No Svelte. |
| `placement.js` | The "where does it fit" solver. No Svelte. |
| `presets.js` | Starting sizes and clearances for common pieces. |
| `sample-building.js` | Flat 12 approximated from your Sheet 03. Replace it. |

Use `FloorPlan` and `RoomDirectory` separately if you want your own layout; both take the same `plan`.

## Coordinates

Everything is millimetres in one building-wide space, origin at a datum of your choosing on the master schematic, y pointing down. Rooms, doors, fixtures and furniture all share it. There are no per-room coordinate systems, which is what makes dragging between rooms free and lets a 2000 mm sofa simply be `w: 2000`.

Furniture is stored by its centre (`cx`, `cy`), its unrotated size (`w` across the front, `h` deep) and a rotation of 0, 90, 180 or 270. At 0 the front faces down the page. The plan draws a heavier line on the front edge so you can see which way each piece faces.

Which room a piece is in (`roomId`) is derived from where its centre sits and updates as it moves. Position is the source of truth.

## Building data

```js
{
  id: 'maren-house-flat-12',
  name: 'Flat 12, Maren House',
  wallThickness: 100,                 // drawn only; not used in maths
  rooms: [
    { id: 'living', name: 'Living room', points: [[0, 0], [4900, 0], [4900, 3400], [0, 3400]] },
    // optional label: [x, y] if the bbox centre is a poor spot for the name
  ],
  doors: [
    // hinge, leaf end when closed, leaf end when open. The swing is kept clear automatically
    // and assigned to whichever room it opens into.
    { label: 'living room door', hinge: [3350, 3400], to: [4150, 3400], swing: [3350, 2600] },
  ],
  fixtures: [
    // Built-ins. Same shape as furniture; they block placement but can't be moved or deleted.
    { id: 'fx-bath', label: 'Bath', cx: 5050, cy: 7800, w: 1700, h: 700, rotation: 180, clearance: { front: 600 } },
  ],
}
```

Room `points` should be the internal faces of walls, the same clear dimensions your sheets print (4 900 × 3 400). Rectilinear polygons are fully supported, including notches like the chimney breast in the sample. Angled walls work for containment and placement; the wall-distance dimension lines only measure to horizontal and vertical walls.

### From your schematics

Room polygons are the one piece of authoring this needs. If your master schematic is a CAD export to SVG with rooms as named paths, extract their coordinates once at build time and multiply by your drawing's mm-per-unit. If rooms aren't separate shapes, trace them: the coordinates are just the room corners in mm, and your sheets already give you the dimensions.

### Using your floor plan artwork

Pass the image as a backdrop placed at its real-world size, and switch off the drawn walls:

```svelte
<FloorPlan
  {plan}
  walls={false}
  backdrop={{ href: '/plans/flat-12.png', x: -150, y: -150, width: 6800, height: 8450 }}
/>
```

`x`, `y`, `width` and `height` are in mm. To calibrate, measure a long wall in the image in pixels, divide its known length in mm by that, and multiply the image's pixel size by the result. Then nudge `x` and `y` until the room outlines sit on the drawn walls. Floors go transparent over a backdrop but still take clicks.

`FloorPlanApp` passes `backdrop` through; to hide walls there, edit its `<FloorPlan>` line.

## Clearance and fit

Each piece can carry `clearance: { front, back, left, right }` in mm (a bare number means front only; left and right are as seen standing at the front). This is the floor that must stay free for the piece to be usable.

The rules, used both for the red conflict warnings and the green "fits here" shading:

- A piece and its clearance must be inside the room.
- A piece can't overlap another piece, another piece's clearance, or a door swing.
- Clearance zones may overlap each other and door swings. Two chairs can share the floor they pull out into.

The solver rasterises the room into 50 mm cells and uses prefix sums so each candidate position is one lookup. The largest sample room solves in under 10 ms, and it only re-runs when something other than the dragged piece's position changes.

### Access profiles

`plan.clearanceFor` decides each piece's clearance and can be swapped at runtime. Every conflict and every fit region updates to match. This is the hook for your Unaided / Cane / Walker / Wheelchair scenario:

```js
const PROFILE = { unaided: 1, cane: 1.1, walker: 1.4, wheelchair: 1.8 };

plan.clearanceFor = (item) => {
  if (!item.clearance) return null;
  const k = PROFILE[scenario];
  return { ...item.clearance, front: Math.max(item.clearance.front * k, scenario === 'wheelchair' ? 1500 : 0) };
};
```

## Saving

`plan.toJSON()` returns a versioned document with the movable furniture only; fixtures always come from the building data.

```json
{ "schema": 1, "buildingId": "maren-house-flat-12", "items": [ { "id": "…", "label": "Desk", "cx": 1650, "cy": 6200, … } ] }
```

`FloorPlanApp` saves to `localStorage` by default, debounced. For a real backend:

```svelte
<!-- layout comes from your +page.js load() -->
<FloorPlanApp {building} initial={data.layout} onchange={(doc) => saveLayout(doc)} />
```

`plan.load(doc)` rejects documents with the wrong schema or building id rather than half-loading them. If you change the item shape later, bump `SCHEMA` in `plan.svelte.js` and migrate in `load`.

## Using it

- Click a room, or Tab to it and press Enter, to zoom in. Escape or "Whole building" to zoom out.
- Drag a piece to move it. It snaps to a 50 mm grid and to walls and neighbouring pieces when close; blue guides show what it caught. Hold Alt to place freely.
- Arrow keys nudge 50 mm (Shift for 250, Alt for 10). R rotates, Shift+R the other way. Delete removes.
- ⌘Z / Ctrl+Z undoes, with Shift to redo. A drag is one undo step; a run of nudges is one step.
- Scroll to pan, pinch or ⌘/Ctrl+scroll to zoom.
- The selected piece shows its distance to each wall in mm.

## Store API

```js
const plan = new Plan(building, { saved, clearanceFor });

plan.selectRoom(id | null)          plan.selectItem(id | null)
plan.add(spec, roomId?)  → { id, placed }   // auto-places at the nearest clear spot, turning it if needed
plan.move(id, cx, cy)               // no history; wrap drags in beginChange() / commitChange()
plan.nudge(id, dx, dy)              plan.rotate(id, ±90)
plan.resize(id, w, h)               // keeps the top-left corner fixed
plan.setPosition(id, left, top)     // room-relative top-left, mm
plan.update(id, { label, status, clearance, meta })
plan.relocate(id)                   // jump to the nearest clear spot
plan.remove(id)                     plan.undo()   plan.redo()
plan.toJSON()                       plan.load(doc)

// Reactive, read-only
plan.byRoom        Map<roomId | null, Item[]>
plan.conflicts     Map<itemId, string[]>
plan.placement     { count, regions, nearest(x, y) } for the selected piece
plan.geometry      Map<itemId, { body, zone }>
plan.selectedRoom  plan.selectedItem  plan.canUndo  plan.canRedo
```

`status` is `'planned'` (something you're thinking of ordering, drawn in blue) or `'existing'`. Put order numbers, SKUs or prices in `meta`; it's saved untouched.

## Deliberately left out

Free rotation (needs separating-axis overlap tests; the geometry module is the only place that would change), multi-select, grouping, editing rooms, and a canvas renderer. A few hundred rectangles is well within what SVG handles.
