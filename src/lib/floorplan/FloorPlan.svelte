<!--
  The plan canvas. One SVG whose viewBox is the camera; everything inside is drawn
  in world millimetres. All pointer handling lives here and resolves its target with
  closest('[data-item]') / closest('[data-room]'), so pieces carry no listeners.
-->
<script>
  import { untrack } from 'svelte';
  import { Camera } from './camera.svelte.js';
  import { bodyRect, edgeSnap, frontEdge, snapToGrid, wallGaps } from './geometry.js';
  import { dims, mm } from './format.js';

  /**
   * @type {{
   *   plan: import('./plan.svelte.js').Plan,
   *   backdrop?: { href: string, x: number, y: number, width: number, height: number, opacity?: number } | null,
   *   walls?: boolean,
   *   showFit?: boolean,
   *   showDimensions?: boolean,
   * }}
   */
  let { plan, backdrop = null, walls = true, showFit = true, showDimensions = true } = $props();

  const uid = $props.id();
  const camera = new Camera();

  const FONT = 11; // label size in screen pixels
  const CLICK_SLOP = 3; // pixels of movement before a press becomes a drag

  /** @type {SVGSVGElement | null} */
  let svg = $state(null);
  let draggingId = $state(null);
  let panning = $state(false);
  let guides = $state({ x: null, y: null, roomId: null });

  /** Per-gesture scratch state. Not reactive: nothing renders from it. */
  let gesture = null;

  const view = $derived(camera.view);
  const px = $derived(camera.mmPerPx);
  const room = $derived(plan.selectedRoom);
  const selected = $derived(plan.selectedItem);
  const wall = $derived(plan.building.wallThickness ?? 80);

  const hint = $derived.by(() => {
    if (!room) return 'Select a room to plan its furniture.';
    if (!selected) return 'Add furniture from the panel, or select a piece to move it.';
    if (selected.fixed) return `${selected.label} is built in and can't be moved.`;
    return 'Drag to move. R rotates, arrow keys nudge 50 mm, hold Alt to place freely.';
  });

  // ── Camera follows the selected room ──────────────────────────────────────
  // Animate when the room changes; snap instantly on first layout and on resize.
  let focusedId = undefined;
  $effect(() => {
    const id = plan.selectedRoomId;
    const w = camera.width, h = camera.height;
    if (!w || !h) return;
    untrack(() => {
      const r = plan.room(id);
      camera.fit(r ? r.bbox : plan.bbox, {
        pad: r ? 450 : 800,
        instant: focusedId === undefined || focusedId === id,
      });
      focusedId = id;
    });
  });

  // Wheel pans, pinch or Ctrl/⌘ + wheel zooms. Attached by hand because it must call
  // preventDefault, which needs a non-passive listener.
  $effect(() => {
    const el = svg;
    if (!el) return;
    const onwheel = (e) => {
      e.preventDefault();
      const scale = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? el.clientHeight : 1;
      const dx = e.deltaX * scale, dy = e.deltaY * scale;
      if (e.ctrlKey || e.metaKey) {
        const factor = Math.exp(Math.max(-0.5, Math.min(0.5, dy * 0.01)));
        const max = Math.max(plan.bbox.w, plan.bbox.h) * 3;
        camera.zoomAt(factor, e.clientX, e.clientY, el.getBoundingClientRect(), { min: 400, max });
      } else {
        camera.panBy(-dx, -dy);
      }
    };
    el.addEventListener('wheel', onwheel, { passive: false });
    return () => el.removeEventListener('wheel', onwheel);
  });

  // ── Pointer routing ───────────────────────────────────────────────────────

  const itemIdAt = (t) => t?.closest?.('[data-item]')?.getAttribute('data-item') ?? null;
  const roomIdAt = (t) => t?.closest?.('[data-room]')?.getAttribute('data-room') ?? null;

  function onpointerdown(e) {
    if (e.button !== 0 || !svg) return;
    const rect = svg.getBoundingClientRect();
    const itemId = itemIdAt(e.target);
    const item = plan.item(itemId);
    svg.setPointerCapture(e.pointerId);

    if (item && !item.fixed && plan.selectedRoomId && item.roomId === plan.selectedRoomId) {
      const p = camera.toWorld(e.clientX, e.clientY, rect);
      plan.selectItem(item.id);
      plan.beginChange();
      gesture = { kind: 'item', id: item.id, ox: item.cx - p.x, oy: item.cy - p.y, rect, sx: e.clientX, sy: e.clientY, moved: false };
    } else {
      gesture = {
        kind: 'pan',
        sx: e.clientX,
        sy: e.clientY,
        lx: e.clientX,
        ly: e.clientY,
        moved: false,
        itemId,
        roomId: roomIdAt(e.target) ?? item?.roomId ?? null,
      };
    }
  }

  function onpointermove(e) {
    const g = gesture;
    if (!g) return;
    if (!g.moved) {
      if (Math.hypot(e.clientX - g.sx, e.clientY - g.sy) < CLICK_SLOP) return;
      g.moved = true;
    }
    if (g.kind === 'item') {
      dragItem(e, g);
    } else {
      panning = true;
      camera.panBy(e.clientX - g.lx, e.clientY - g.ly);
      g.lx = e.clientX;
      g.ly = e.clientY;
    }
  }

  function dragItem(e, g) {
    const item = plan.item(g.id);
    if (!item) return;
    draggingId = item.id;
    const p = camera.toWorld(e.clientX, e.clientY, g.rect);
    let cx = p.x + g.ox;
    let cy = p.y + g.oy;
    let gx = null, gy = null;
    const target = plan.roomAt(cx, cy) ?? plan.room(item.roomId);

    if (!e.altKey) {
      // Grid first, so free floor placement lands on round numbers…
      const b = bodyRect({ ...item, cx, cy });
      cx += snapToGrid(b.x, plan.grid) - b.x;
      cy += snapToGrid(b.y, plan.grid) - b.y;
      // …then walls and neighbouring furniture, which win when close.
      if (target) {
        const { xs, ys } = plan.snapLines(target.id, item.id);
        const s = edgeSnap(bodyRect({ ...item, cx, cy }), xs, ys, Math.min(200, 10 * px));
        cx += s.dx;
        cy += s.dy;
        gx = s.gx;
        gy = s.gy;
      }
    }

    plan.move(item.id, cx, cy);
    guides = { x: gx, y: gy, roomId: target?.id ?? null };
  }

  function endGesture(e) {
    const g = gesture;
    if (!g) return;
    gesture = null;
    if (svg?.hasPointerCapture(e.pointerId)) svg.releasePointerCapture(e.pointerId);
    draggingId = null;
    panning = false;
    guides = { x: null, y: null, roomId: null };

    if (g.kind === 'item') {
      plan.commitChange();
      return;
    }
    if (g.moved || e.type === 'pointercancel') return;

    // A click, not a drag.
    const clicked = plan.item(g.itemId);
    if (clicked && plan.selectedRoomId && clicked.roomId === plan.selectedRoomId) {
      plan.selectItem(clicked.id);
    } else if (g.roomId && g.roomId !== plan.selectedRoomId) {
      plan.selectRoom(g.roomId);
    } else {
      plan.selectItem(null);
    }
  }

  // ── Keyboard ──────────────────────────────────────────────────────────────

  function onkeydown(e) {
    const key = e.key;
    const mod = e.metaKey || e.ctrlKey;

    if (mod && key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) plan.redo();
      else plan.undo();
      return;
    }
    if (mod && key.toLowerCase() === 'y') {
      e.preventDefault();
      plan.redo();
      return;
    }
    if (key === 'Enter' || key === ' ') {
      const rid = roomIdAt(e.target);
      if (rid) {
        e.preventDefault();
        plan.selectRoom(rid);
        return;
      }
    }
    if (key === 'Escape') {
      e.preventDefault();
      if (plan.selectedItemId) plan.selectItem(null);
      else plan.selectRoom(null);
      svg?.focus();
      return;
    }

    const it = plan.selectedItem;
    if (!it || it.fixed) return;
    const step = e.shiftKey ? 250 : e.altKey ? 10 : plan.grid;
    const arrows = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (key in arrows) {
      e.preventDefault();
      plan.nudge(it.id, ...arrows[key]);
    } else if (key === 'r' || key === 'R') {
      e.preventDefault();
      plan.rotate(it.id, e.shiftKey ? -90 : 90);
    } else if (key === 'Delete' || key === 'Backspace') {
      e.preventDefault();
      plan.remove(it.id);
      svg?.focus();
    }
  }

  function onfocusin(e) {
    const id = itemIdAt(e.target);
    const it = plan.item(id);
    if (it && it.roomId === plan.selectedRoomId && plan.selectedItemId !== id) plan.selectItem(id);
  }

  // ── Drawing helpers ───────────────────────────────────────────────────────

  const pts = (points) => points.map(([x, y]) => `${x},${y}`).join(' ');

  const regionPath = (regions) => regions.map((r) => `M${r.x} ${r.y}h${r.w}v${r.h}h${-r.w}z`).join('');

  function doorPath(d) {
    const [hx, hy] = d.hinge, [tx, ty] = d.to, [sx, sy] = d.swing;
    const r = Math.hypot(tx - hx, ty - hy);
    const sweep = (tx - hx) * (sy - hy) - (ty - hy) * (sx - hx) > 0 ? 1 : 0;
    return `M${hx} ${hy}L${sx} ${sy}M${tx} ${ty}A${r} ${r} 0 0 ${sweep} ${sx} ${sy}`;
  }

  const labelFits = (text, r) => r.w / px > text.length * FONT * 0.58 + 10 && r.h / px > FONT * 2;
  const sizeFits = (r) => r.h / px > FONT * 3.6 && r.w / px > 70;

  const labelPoint = (r) =>
    r.label ? { x: r.label[0], y: r.label[1] } : { x: r.bbox.x + r.bbox.w / 2, y: r.bbox.y + r.bbox.h / 2 };

  /** Dimension lines from each side of the selected piece to the nearest wall. */
  function dimensionLines(b, gaps) {
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    const out = [];
    if (gaps.left > 1) out.push({ key: 'l', x1: b.x - gaps.left, y1: cy, x2: b.x, y2: cy, v: gaps.left, tx: b.x - gaps.left / 2, ty: cy - 6 * px, anchor: 'middle' });
    if (gaps.right > 1) out.push({ key: 'r', x1: b.x + b.w, y1: cy, x2: b.x + b.w + gaps.right, y2: cy, v: gaps.right, tx: b.x + b.w + gaps.right / 2, ty: cy - 6 * px, anchor: 'middle' });
    if (gaps.up > 1) out.push({ key: 'u', x1: cx, y1: b.y - gaps.up, x2: cx, y2: b.y, v: gaps.up, tx: cx + 5 * px, ty: b.y - gaps.up / 2, anchor: 'start' });
    if (gaps.down > 1) out.push({ key: 'd', x1: cx, y1: b.y + b.h, x2: cx, y2: b.y + b.h + gaps.down, v: gaps.down, tx: cx + 5 * px, ty: b.y + b.h + gaps.down / 2, anchor: 'start' });
    return out;
  }
</script>

<div class="fp" bind:clientWidth={camera.width} bind:clientHeight={camera.height}>
  <svg
    bind:this={svg}
    viewBox="{view.x} {view.y} {view.w} {view.h}"
    class:panning
    class:dragging={draggingId !== null}
    role="application"
    aria-roledescription="floor plan"
    aria-label="Floor plan of {plan.building.name}"
    tabindex="0"
    {onpointerdown}
    {onpointermove}
    onpointerup={endGesture}
    onpointercancel={endGesture}
    {onkeydown}
    {onfocusin}
  >
    <defs>
      <pattern id="{uid}-hatch" patternUnits="userSpaceOnUse" width="60" height="60" patternTransform="rotate(45)">
        <rect width="60" height="60" class="hatch-bg" />
        <line x1="0" y1="0" x2="0" y2="60" class="hatch" stroke-width={px} />
      </pattern>
    </defs>

    {#if backdrop}
      <image
        href={backdrop.href}
        x={backdrop.x}
        y={backdrop.y}
        width={backdrop.width}
        height={backdrop.height}
        opacity={backdrop.opacity ?? 1}
        preserveAspectRatio="none"
        pointer-events="none"
      />
    {/if}

    <!-- Floors: the click targets for choosing a room -->
    {#each plan.rooms as r (r.id)}
      <polygon
        data-room={r.id}
        points={pts(r.points)}
        class="floor"
        class:current={r.id === plan.selectedRoomId}
        class:other={plan.selectedRoomId !== null && r.id !== plan.selectedRoomId}
        class:over-backdrop={!!backdrop}
        role="button"
        tabindex={r.id === plan.selectedRoomId ? -1 : 0}
        aria-label="{r.name}, {dims(r.bbox.w, r.bbox.h)} millimetres"
      />
    {/each}

    <!-- Where the selected piece would fit -->
    {#if showFit && selected && plan.placement}
      <path d={regionPath(plan.placement.regions)} class="fit" />
    {/if}

    {#if walls}
      {#each plan.rooms as r (r.id)}
        <polygon points={pts(r.points)} class="wall" stroke-width={wall} />
      {/each}
      {#each plan.doors as d, i (i)}
        <line x1={d.hinge[0]} y1={d.hinge[1]} x2={d.to[0]} y2={d.to[1]} class="opening" stroke-width={wall + 2 * px} />
      {/each}
    {/if}

    {#each plan.doors as d, i (i)}
      <path d={doorPath(d)} class="door" stroke-width={px} />
    {/each}

    <!-- Clearance zones, beneath every piece so they never hide or capture one -->
    {#each plan.items as it (it.id)}
      {@const z = plan.geometry.get(it.id)?.zone}
      {#if z}
        <rect
          x={z.x}
          y={z.y}
          width={z.w}
          height={z.h}
          class="zone"
          class:fixed={it.fixed}
          class:bad={plan.conflicts.has(it.id)}
          class:other={plan.selectedRoomId !== null && it.roomId !== plan.selectedRoomId}
          stroke-width={px}
          stroke-dasharray="{4 * px} {3 * px}"
        />
      {/if}
    {/each}

    <!-- Furniture -->
    {#each plan.items as it (it.id)}
      {@const g = plan.geometry.get(it.id)}
      {@const issues = plan.conflicts.get(it.id)}
      {@const here = plan.selectedRoomId !== null && it.roomId === plan.selectedRoomId}
      {@const isSelected = it.id === plan.selectedItemId}
      {@const front = frontEdge(it)}
      {#if g}
        <g
          data-item={it.id}
          class="item"
          class:fixed={it.fixed}
          class:planned={it.status === 'planned'}
          class:selected={isSelected}
          class:bad={!!issues}
          class:other={plan.selectedRoomId !== null && !here}
          class:movable={here && !it.fixed}
          role="button"
          tabindex={here ? 0 : -1}
          aria-label="{it.label}, {dims(it.w, it.h)} millimetres{issues ? `. ${issues.join('. ')}` : ''}"
        >
          <title>{it.label}, {dims(it.w, it.h)} mm{issues ? `\n${issues.join('\n')}` : ''}</title>
          <rect
            x={g.body.x}
            y={g.body.y}
            width={g.body.w}
            height={g.body.h}
            class="body"
            style:fill={it.fixed && !issues ? `url(#${uid}-hatch)` : null}
            stroke-width={(isSelected ? 2 : 1) * px}
          />
          <line x1={front[0][0]} y1={front[0][1]} x2={front[1][0]} y2={front[1][1]} class="front" stroke-width={2.5 * px} />
          {#if labelFits(it.label, g.body)}
            {@const showSize = sizeFits(g.body)}
            {@const cx = g.body.x + g.body.w / 2}
            {@const cy = g.body.y + g.body.h / 2}
            <text
              x={cx}
              y={showSize ? cy - 0.6 * FONT * px : cy}
              class="label"
              text-anchor="middle"
              font-size={FONT * px}
              stroke-width={3 * px}
            >{it.label}</text>
            {#if showSize}
              <text x={cx} y={cy + 0.75 * FONT * px} text-anchor="middle" class="size" font-size={(FONT - 1.5) * px} stroke-width={3 * px}>
                {dims(it.w, it.h)}
              </text>
            {/if}
          {/if}
        </g>
      {/if}
    {/each}

    <!-- Snap guides while dragging -->
    {#if guides.roomId}
      {@const gr = plan.room(guides.roomId)}
      {#if gr && guides.x !== null}
        <line x1={guides.x} y1={gr.bbox.y} x2={guides.x} y2={gr.bbox.y + gr.bbox.h} class="guide" stroke-width={px} />
      {/if}
      {#if gr && guides.y !== null}
        <line x1={gr.bbox.x} y1={guides.y} x2={gr.bbox.x + gr.bbox.w} y2={guides.y} class="guide" stroke-width={px} />
      {/if}
    {/if}

    <!-- Distances to walls for the selected piece -->
    {#if showDimensions && selected && room && selected.roomId === room.id}
      {@const b = plan.geometry.get(selected.id)?.body}
      {#if b}
        {#each dimensionLines(b, wallGaps(b, room.points)) as d (d.key)}
          <line x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2} class="dim" stroke-width={px} />
          <text x={d.tx} y={d.ty} text-anchor={d.anchor} class="dim-label" font-size={10 * px} stroke-width={3 * px}>
            {mm(d.v)}
          </text>
        {/each}
      {/if}
    {/if}

    <!-- Room names on the overview -->
    {#if !room}
      {#each plan.rooms as r (r.id)}
        {@const at = labelPoint(r)}
        <text x={at.x} y={at.y - 7 * px} text-anchor="middle" class="room-name" font-size={12 * px} stroke-width={4 * px}>{r.name}</text>
        <text x={at.x} y={at.y + 8 * px} text-anchor="middle" class="room-size" font-size={10 * px} stroke-width={4 * px}>
          {dims(r.bbox.w, r.bbox.h)}
        </text>
      {/each}
    {/if}
  </svg>

  {#if room}
    <button type="button" class="overview" onclick={() => plan.selectRoom(null)}>Whole building</button>
  {/if}
  <p class="hint" aria-live="polite">{hint}</p>
</div>

<style>
  .fp {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 320px;
    overflow: hidden;
    background: var(--fp-paper, #fff);
    font-family: var(--fp-font, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif);
  }

  svg {
    display: block;
    width: 100%;
    height: 100%;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
  }
  svg:focus { outline: none; }
  svg:focus-visible { outline: 2px solid var(--fp-accent, #2347d1); outline-offset: -2px; }
  svg.panning { cursor: grabbing; }

  /* Floors */
  .floor {
    fill: var(--fp-floor, #fff);
    cursor: pointer;
    transition: fill 0.15s;
  }
  .floor.other { fill: var(--fp-floor-muted, #f1f1ee); }
  .floor.current { fill: var(--fp-floor, #fff); cursor: default; }
  .floor:not(.current):hover,
  .floor:focus-visible { fill: var(--fp-floor-hover, #edf1fc); outline: none; }
  .floor.over-backdrop { fill: transparent; }
  .floor.over-backdrop.other { fill: rgb(255 255 255 / 0.6); }
  .floor.over-backdrop:not(.current):hover { fill: rgb(35 71 209 / 0.08); }

  .fit {
    fill: var(--fp-fit, #1d8a58);
    fill-opacity: 0.13;
    pointer-events: none;
  }

  .wall {
    fill: none;
    stroke: var(--fp-ink, #000);
    stroke-linejoin: miter;
    pointer-events: none;
  }
  .opening { stroke: var(--fp-floor, #fff); pointer-events: none; }
  .door { fill: none; stroke: var(--fp-ink-soft, #707070); pointer-events: none; }

  /* Furniture */
  .item { outline: none; }
  .item .body { fill: var(--fp-item, #fff); stroke: var(--fp-ink, #000); }
  .zone { fill: var(--fp-zone, rgb(0 0 0 / 0.03)); stroke: var(--fp-ink-soft, #707070); pointer-events: none; }
  .zone.fixed { fill: none; stroke-opacity: 0.6; }
  .zone.bad { stroke: var(--fp-bad, #c4262e); }
  .zone.other { opacity: 0.4; }
  .item .front { stroke: var(--fp-ink, #000); pointer-events: none; }

  .item.fixed .body { stroke: var(--fp-ink-soft, #707070); }
  .item.planned .body { fill: var(--fp-planned, #e8edfc); stroke: var(--fp-accent, #2347d1); }
  .item.planned .front { stroke: var(--fp-accent, #2347d1); }
  .item.selected .body { stroke: var(--fp-accent, #2347d1); }
  .item:focus-visible .body { stroke: var(--fp-accent, #2347d1); }

  .item.bad .body { fill: var(--fp-bad-tint, #fdeaea); stroke: var(--fp-bad, #c4262e); }
  .item.bad .front { stroke: var(--fp-bad, #c4262e); }

  .item.other { opacity: 0.4; }
  .item.movable { cursor: grab; }
  svg.dragging, svg.dragging .item { cursor: grabbing; }

  .hatch-bg { fill: var(--fp-fixed, #f4f4f2); }
  .hatch { stroke: var(--fp-ink-soft, #707070); stroke-opacity: 0.45; }

  /* Text drawn in the plan */
  text {
    dominant-baseline: central;
    pointer-events: none;
    paint-order: stroke;
    stroke: var(--fp-floor, #fff);
    stroke-linejoin: round;
  }
  .label { fill: var(--fp-ink, #000); font-weight: 500; }
  .item.planned .label { stroke: var(--fp-planned, #e8edfc); }
  .item.bad .label { stroke: var(--fp-bad-tint, #fdeaea); }
  .size,
  .dim-label,
  .room-size {
    font-family: var(--fp-mono, ui-monospace, 'SF Mono', Menlo, Consolas, monospace);
    fill: var(--fp-ink-soft, #707070);
  }
  .item.planned .size { stroke: var(--fp-planned, #e8edfc); }
  .item.bad .size { stroke: var(--fp-bad-tint, #fdeaea); }
  .room-name { fill: var(--fp-ink, #000); font-weight: 600; }
  .dim-label { fill: var(--fp-accent, #2347d1); }

  .guide { stroke: var(--fp-accent, #2347d1); stroke-opacity: 0.7; pointer-events: none; }
  .dim { stroke: var(--fp-accent, #2347d1); pointer-events: none; }

  /* Overlay controls */
  .overview,
  .hint {
    position: absolute;
    margin: 0;
    font-size: 13px;
    line-height: 1.3;
    background: var(--fp-paper, #fff);
    border: 1px solid var(--fp-line, #dedede);
    border-radius: 6px;
  }
  .overview {
    top: 12px;
    left: 12px;
    padding: 6px 10px;
    color: var(--fp-ink, #000);
    font: inherit;
    font-size: 13px;
    cursor: pointer;
  }
  .overview:hover { background: var(--fp-floor-muted, #f1f1ee); }
  .overview:focus-visible { outline: 2px solid var(--fp-accent, #2347d1); outline-offset: 2px; }
  .hint {
    left: 12px;
    bottom: 12px;
    right: 12px;
    width: fit-content;
    max-width: calc(100% - 24px);
    padding: 6px 10px;
    color: var(--fp-ink-soft, #5c5c5c);
    pointer-events: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .floor { transition: none; }
  }
</style>
