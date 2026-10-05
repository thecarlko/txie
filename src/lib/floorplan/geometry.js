// Geometry for the floor plan.
//
// Every coordinate is millimetres in ONE building-wide world space, y pointing down.
//   Rect     { x, y, w, h }   axis-aligned
//   Polygon  [[x, y], ...]    room outlines, any simple polygon (rectilinear is best)
//
// Furniture is stored by centre (cx, cy), unrotated size (w × h) and a rotation in
// quarter turns. At rotation 0 the item's front faces +y (down the page). Rotation is
// clockwise on screen. Restricting rotation to 90° keeps every footprint axis-aligned,
// so overlap tests stay at four comparisons.

const EPS = 0.5; // half a millimetre: things that touch are not overlapping

export function bboxOf(points) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of points) {
    if (x < x0) x0 = x;
    if (y < y0) y0 = y;
    if (x > x1) x1 = x;
    if (y > y1) y1 = y;
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

export function unionRect(a, b) {
  const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y);
  return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y };
}

/** Shoelace area in mm². */
export function polygonArea(points) {
  let s = 0;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    s += (points[j][0] + points[i][0]) * (points[j][1] - points[i][1]);
  }
  return Math.abs(s) / 2;
}

/** Even-odd ray cast. Points exactly on an edge are ambiguous; callers inset by EPS. */
export function pointInPolygon(x, y, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i], [xj, yj] = points[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/**
 * True when the rect sits inside the polygon. Flush against a wall counts as inside.
 * Corner tests alone miss a notch poking into the rect (a chimney breast, say),
 * so we also reject any polygon vertex strictly inside the rect.
 */
export function rectInPolygon(r, points) {
  const x0 = r.x + EPS, y0 = r.y + EPS, x1 = r.x + r.w - EPS, y1 = r.y + r.h - EPS;
  if (x1 <= x0 || y1 <= y0) return pointInPolygon(r.x + r.w / 2, r.y + r.h / 2, points);
  if (
    !pointInPolygon(x0, y0, points) ||
    !pointInPolygon(x1, y0, points) ||
    !pointInPolygon(x1, y1, points) ||
    !pointInPolygon(x0, y1, points)
  ) return false;
  for (const [px, py] of points) {
    if (px > x0 && px < x1 && py > y0 && py < y1) return false;
  }
  return true;
}

/** Strict overlap: rects that only share an edge do not overlap. */
export function rectsOverlap(a, b) {
  return a.x + EPS < b.x + b.w && b.x + EPS < a.x + a.w && a.y + EPS < b.y + b.h && b.y + EPS < a.y + a.h;
}

/** Normalise any angle to 0, 90, 180 or 270. */
export function quarterTurn(deg) {
  return (((Math.round((Number(deg) || 0) / 90) * 90) % 360) + 360) % 360;
}

function turn(x, y, q) {
  switch (q) {
    case 90: return [-y, x];
    case 180: return [-x, -y];
    case 270: return [y, -x];
    default: return [x, y];
  }
}

/** Map a local rect (relative to the item's centre, unrotated) into world space. */
function placeLocal(item, x0, y0, x1, y1) {
  const q = quarterTurn(item.rotation);
  const [ax, ay] = turn(x0, y0, q);
  const [bx, by] = turn(x1, y1, q);
  return {
    x: item.cx + Math.min(ax, bx),
    y: item.cy + Math.min(ay, by),
    w: Math.abs(bx - ax),
    h: Math.abs(by - ay),
  };
}

/** The item's footprint in world space. */
export function bodyRect(item) {
  return placeLocal(item, -item.w / 2, -item.h / 2, item.w / 2, item.h / 2);
}

/**
 * Clearance is the floor that must stay free for the item to be usable: chair
 * space at a desk, the swing of a wardrobe door. A plain number means "in front".
 * left/right are as seen standing at the front, facing the item.
 */
export function normaliseClearance(c) {
  if (c == null) return null;
  if (typeof c === 'number') return c > 0 ? { front: c, back: 0, left: 0, right: 0 } : null;
  const n = {
    front: Math.max(0, Number(c.front) || 0),
    back: Math.max(0, Number(c.back) || 0),
    left: Math.max(0, Number(c.left) || 0),
    right: Math.max(0, Number(c.right) || 0),
  };
  return n.front || n.back || n.left || n.right ? n : null;
}

/** Footprint plus clearance in world space, or null when there is no clearance. */
export function zoneRect(item, clearance) {
  const c = normaliseClearance(clearance);
  if (!c) return null;
  return placeLocal(
    item,
    -item.w / 2 - c.left,
    -item.h / 2 - c.back,
    item.w / 2 + c.right,
    item.h / 2 + c.front,
  );
}

/** The front edge as a world-space segment, so the plan can show which way things face. */
export function frontEdge(item) {
  const q = quarterTurn(item.rotation);
  const [ax, ay] = turn(-item.w / 2, item.h / 2, q);
  const [bx, by] = turn(item.w / 2, item.h / 2, q);
  return [[item.cx + ax, item.cy + ay], [item.cx + bx, item.cy + by]];
}

export function snapToGrid(v, step) {
  return Math.round(v / step) * step;
}

/**
 * Pull a rect's edges onto nearby lines (walls, other furniture) within threshold.
 * Returns the correction and which line won on each axis, for drawing guides.
 */
export function edgeSnap(r, xs, ys, threshold) {
  const pick = (a0, a1, lines) => {
    let best = null;
    for (const t of lines) {
      for (const e of [a0, a1]) {
        const d = t - e;
        if (Math.abs(d) <= threshold && (best === null || Math.abs(d) < Math.abs(best.d))) best = { d, at: t };
      }
    }
    return best;
  };
  const bx = pick(r.x, r.x + r.w, xs);
  const by = pick(r.y, r.y + r.h, ys);
  return { dx: bx?.d ?? 0, dy: by?.d ?? 0, gx: bx?.at ?? null, gy: by?.at ?? null };
}

/**
 * Distance from each side of the rect to the nearest wall, measured from the rect's
 * centre line. Only horizontal and vertical walls are considered.
 */
export function wallGaps(r, points) {
  const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
  let left = -Infinity, right = Infinity, up = -Infinity, down = Infinity;
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % points.length];
    if (x1 === x2) {
      if (cy < Math.min(y1, y2) || cy > Math.max(y1, y2)) continue;
      if (x1 <= r.x + EPS && x1 > left) left = x1;
      if (x1 >= r.x + r.w - EPS && x1 < right) right = x1;
    } else if (y1 === y2) {
      if (cx < Math.min(x1, x2) || cx > Math.max(x1, x2)) continue;
      if (y1 <= r.y + EPS && y1 > up) up = y1;
      if (y1 >= r.y + r.h - EPS && y1 < down) down = y1;
    }
  }
  return {
    left: Number.isFinite(left) ? r.x - left : null,
    right: Number.isFinite(right) ? right - (r.x + r.w) : null,
    up: Number.isFinite(up) ? r.y - up : null,
    down: Number.isFinite(down) ? down - (r.y + r.h) : null,
  };
}

/**
 * The square a door sweeps through. A door is three points: the hinge, the end of
 * the leaf when closed, and the end of the leaf when fully open.
 */
export function doorZone(door) {
  const [hx, hy] = door.hinge, [tx, ty] = door.to, [sx, sy] = door.swing;
  return bboxOf([door.hinge, door.to, door.swing, [tx + sx - hx, ty + sy - hy]]);
}
