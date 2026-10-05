// Where can this piece go?
//
// The room is rasterised into square cells (50 mm by default). Two occupancy grids:
//
//   bodyBlocked  outside the room, other furniture, other furniture's clearance, door swings
//   zoneBlocked  outside the room, other furniture
//
// A candidate position is valid when the new item's body covers no bodyBlocked cell
// and its clearance covers no zoneBlocked cell. Clearance zones may overlap each other
// (two chairs can share the same patch of floor to pull out into), but nothing may
// stand inside one.
//
// A 2D prefix sum over each grid makes every candidate an O(1) lookup, so a whole
// room is solved in well under a millisecond. Cells are counted conservatively: a cell
// only counts as free floor if it lies entirely inside the room and touches no obstacle.

import { bodyRect, rectInPolygon, zoneRect } from './geometry.js';

const E = 1e-6;

function prefixSum(grid, cols, rows) {
  const W = cols + 1;
  const S = new Int32Array(W * (rows + 1));
  for (let r = 0; r < rows; r++) {
    let run = 0;
    for (let c = 0; c < cols; c++) {
      run += grid[r * cols + c];
      S[(r + 1) * W + c + 1] = S[r * W + c + 1] + run;
    }
  }
  return S;
}

function sumOf(S, W, c0, r0, c1, r1) {
  return S[r1 * W + c1] - S[r0 * W + c1] - S[r1 * W + c0] + S[r0 * W + c0];
}

/**
 * @param {{ points: number[][], bbox: {x:number,y:number,w:number,h:number} }} room
 * @param {{ body: object|null, zone: object|null }[]} obstacles  world-space rects
 * @param {{ w: number, h: number, rotation?: number, clearance?: any }} spec
 */
export function solvePlacement(room, obstacles, spec, { cell = 50 } = {}) {
  const { x: ox, y: oy } = room.bbox;
  const cols = Math.max(0, Math.floor(room.bbox.w / cell + E));
  const rows = Math.max(0, Math.floor(room.bbox.h / cell + E));
  const W = cols + 1;
  const n = cols * rows;
  const bodyBlocked = new Uint8Array(n);
  const zoneBlocked = new Uint8Array(n);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cellRect = { x: ox + c * cell, y: oy + r * cell, w: cell, h: cell };
      if (!rectInPolygon(cellRect, room.points)) {
        bodyBlocked[r * cols + c] = 1;
        zoneBlocked[r * cols + c] = 1;
      }
    }
  }

  const paint = (grid, rect) => {
    const c0 = Math.max(0, Math.floor((rect.x - ox) / cell + E));
    const c1 = Math.min(cols, Math.ceil((rect.x + rect.w - ox) / cell - E));
    const r0 = Math.max(0, Math.floor((rect.y - oy) / cell + E));
    const r1 = Math.min(rows, Math.ceil((rect.y + rect.h - oy) / cell - E));
    for (let r = r0; r < r1; r++) for (let c = c0; c < c1; c++) grid[r * cols + c] = 1;
  };

  for (const o of obstacles) {
    if (o.body) {
      paint(bodyBlocked, o.body);
      paint(zoneBlocked, o.body);
    }
    if (o.zone) paint(bodyBlocked, o.zone);
  }

  const S1 = prefixSum(bodyBlocked, cols, rows);
  const S2 = prefixSum(zoneBlocked, cols, rows);

  // The new item's shape, relative to its body's top-left corner, in cells.
  const probe = { cx: 0, cy: 0, w: spec.w, h: spec.h, rotation: spec.rotation ?? 0 };
  const b = bodyRect(probe);
  const z = zoneRect(probe, spec.clearance) ?? b;
  const bw = Math.ceil(b.w / cell - E);
  const bh = Math.ceil(b.h / cell - E);
  const zx0 = Math.floor((z.x - b.x) / cell + E);
  const zy0 = Math.floor((z.y - b.y) / cell + E);
  const zx1 = Math.ceil((z.x + z.w - b.x) / cell - E);
  const zy1 = Math.ceil((z.y + z.h - b.y) / cell - E);

  const valid = new Uint8Array(n);
  const diff = new Int32Array(W * (rows + 1));
  let count = 0;

  for (let r = 0; r + bh <= rows; r++) {
    if (r + zy0 < 0 || r + zy1 > rows) continue;
    for (let c = 0; c + bw <= cols; c++) {
      if (c + zx0 < 0 || c + zx1 > cols) continue;
      if (sumOf(S1, W, c, r, c + bw, r + bh)) continue;
      if (sumOf(S2, W, c + zx0, r + zy0, c + zx1, r + zy1)) continue;
      valid[r * cols + c] = 1;
      count++;
      // Mark the floor this placement would cover, for the "fits here" overlay.
      diff[r * W + c]++;
      diff[r * W + c + bw]--;
      diff[(r + bh) * W + c]--;
      diff[(r + bh) * W + c + bw]++;
    }
  }

  // Integrate the difference array: covered[cell] > 0 means some valid placement uses it.
  const acc = new Int32Array(W * (rows + 1));
  const covered = new Uint8Array(n);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const v =
        diff[r * W + c] +
        (c > 0 ? acc[r * W + c - 1] : 0) +
        (r > 0 ? acc[(r - 1) * W + c] : 0) -
        (r > 0 && c > 0 ? acc[(r - 1) * W + c - 1] : 0);
      acc[r * W + c] = v;
      if (v > 0) covered[r * cols + c] = 1;
    }
  }

  // Merge covered cells into as few rects as reasonable: horizontal runs per row,
  // extended downward while the run below has the same span.
  const regions = [];
  let open = new Map();
  for (let r = 0; r < rows; r++) {
    const next = new Map();
    let c = 0;
    while (c < cols) {
      if (!covered[r * cols + c]) { c++; continue; }
      let e = c;
      while (e < cols && covered[r * cols + e]) e++;
      const key = c * 100000 + e;
      const prev = open.get(key);
      if (prev) {
        prev.h += cell;
        next.set(key, prev);
      } else {
        const rect = { x: ox + c * cell, y: oy + r * cell, w: (e - c) * cell, h: cell };
        regions.push(rect);
        next.set(key, rect);
      }
      c = e;
    }
    open = next;
  }

  /** Centre of the valid placement closest to (x, y), or null if nothing fits. */
  function nearest(x, y) {
    let best = null, bestD = Infinity;
    for (let i = 0; i < n; i++) {
      if (!valid[i]) continue;
      const c = i % cols, r = (i / cols) | 0;
      const cx = ox + c * cell + b.w / 2;
      const cy = oy + r * cell + b.h / 2;
      const d = (cx - x) ** 2 + (cy - y) ** 2;
      if (d < bestD) { bestD = d; best = { x: cx, y: cy }; }
    }
    return best;
  }

  return { cell, cols, rows, count, regions, nearest };
}
