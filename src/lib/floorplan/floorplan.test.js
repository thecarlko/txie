// Run with: node --test  (or vitest; the assertions are plain node:assert)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  bodyRect, edgeSnap, frontEdge, pointInPolygon, polygonArea, quarterTurn,
  rectInPolygon, rectsOverlap, wallGaps, zoneRect, doorZone,
} from './geometry.js';
import { solvePlacement } from './placement.js';
import { bboxOf } from './geometry.js';

const square = (s) => [[0, 0], [s, 0], [s, s], [0, s]];
const roomOf = (points) => ({ points, bbox: bboxOf(points) });
// 2000 × 2000 with a 500 × 500 bite out of the top-right corner
const ell = [[0, 0], [1500, 0], [1500, 500], [2000, 500], [2000, 2000], [0, 2000]];

test('quarterTurn normalises', () => {
  assert.equal(quarterTurn(0), 0);
  assert.equal(quarterTurn(450), 90);
  assert.equal(quarterTurn(-90), 270);
  assert.equal(quarterTurn(89), 90);
  assert.equal(quarterTurn(undefined), 0);
});

test('bodyRect swaps sides at 90 and 270', () => {
  const item = { cx: 1000, cy: 1000, w: 800, h: 400, rotation: 90 };
  assert.deepEqual(bodyRect(item), { x: 800, y: 600, w: 400, h: 800 });
  assert.deepEqual(bodyRect({ ...item, rotation: 180 }), { x: 600, y: 800, w: 800, h: 400 });
});

test('front faces down at 0, left at 90, up at 180, right at 270', () => {
  const base = { cx: 0, cy: 0, w: 200, h: 100 };
  const midY = (seg) => (seg[0][1] + seg[1][1]) / 2;
  const midX = (seg) => (seg[0][0] + seg[1][0]) / 2;
  assert.equal(midY(frontEdge({ ...base, rotation: 0 })), 50);
  assert.equal(midX(frontEdge({ ...base, rotation: 90 })), -50);
  assert.equal(midY(frontEdge({ ...base, rotation: 180 })), -50);
  assert.equal(midX(frontEdge({ ...base, rotation: 270 })), 50);
});

test('zoneRect extends the front and rotates with the item', () => {
  const item = { cx: 0, cy: 0, w: 200, h: 100, rotation: 0 };
  assert.deepEqual(zoneRect(item, 300), { x: -100, y: -50, w: 200, h: 400 });
  assert.deepEqual(zoneRect({ ...item, rotation: 90 }, 300), { x: -350, y: -100, w: 400, h: 200 });
  assert.equal(zoneRect(item, null), null);
  assert.equal(zoneRect(item, { front: 0 }), null);
});

test('rects that touch do not overlap', () => {
  assert.equal(rectsOverlap({ x: 0, y: 0, w: 100, h: 100 }, { x: 100, y: 0, w: 100, h: 100 }), false);
  assert.equal(rectsOverlap({ x: 0, y: 0, w: 100, h: 100 }, { x: 99, y: 0, w: 100, h: 100 }), true);
});

test('rectInPolygon accepts flush, rejects notches', () => {
  assert.equal(rectInPolygon({ x: 0, y: 0, w: 1000, h: 1000 }, square(1000)), true);
  assert.equal(rectInPolygon({ x: 1, y: 0, w: 1000, h: 10 }, square(1000)), false);
  // Spans the bite in the L: all four corners are inside but the notch vertex is not.
  assert.equal(rectInPolygon({ x: 1200, y: 100, w: 700, h: 600 }, [[0, 0], [1500, 0], [1500, 500], [2000, 500], [2000, 2000], [0, 2000]]), false);
  assert.equal(pointInPolygon(1800, 200, ell), false);
  assert.equal(polygonArea(ell), 2000 * 2000 - 500 * 500);
});

test('wallGaps measures to the nearest wall on each side', () => {
  const g = wallGaps({ x: 200, y: 300, w: 400, h: 400 }, square(1000));
  assert.deepEqual(g, { left: 200, right: 400, up: 300, down: 300 });
  // In the L, a rect under the bite measures up to the bite's floor, not the top wall
  const h = wallGaps({ x: 1600, y: 800, w: 200, h: 200 }, ell);
  assert.equal(h.up, 300);
});

test('edgeSnap pulls the nearer edge onto a line', () => {
  const s = edgeSnap({ x: 30, y: 500, w: 100, h: 100 }, [0, 1000], [0, 1000], 50);
  assert.equal(s.dx, -30);
  assert.equal(s.gx, 0);
  assert.equal(s.dy, 0);
  assert.equal(s.gy, null);
});

test('doorZone is the swept square', () => {
  assert.deepEqual(doorZone({ hinge: [0, 0], to: [800, 0], swing: [0, -800] }), { x: 0, y: -800, w: 800, h: 800 });
});

test('empty square room: every grid position fits', () => {
  const s = solvePlacement(roomOf(square(1000)), [], { w: 400, h: 400 });
  assert.equal(s.count, 13 * 13); // (1000 - 400) / 50 + 1 per axis
  assert.deepEqual(s.regions, [{ x: 0, y: 0, w: 1000, h: 1000 }]);
});

test('too big to fit anywhere', () => {
  const s = solvePlacement(roomOf(square(1000)), [], { w: 1100, h: 400 });
  assert.equal(s.count, 0);
  assert.equal(s.nearest(500, 500), null);
  assert.deepEqual(s.regions, []);
});

test('clearance must stay inside the room', () => {
  // 400 deep plus 400 in front needs 800 of depth: body top can be at most y = 200
  const s = solvePlacement(roomOf(square(1000)), [], { w: 400, h: 400, clearance: { front: 400 } });
  assert.equal(s.count, 13 * 5);
});

test('bodies block bodies and zones; zones only block bodies', () => {
  const room = roomOf(square(1000));
  // A zone-only obstacle (a door swing) across the bottom 400 mm.
  const swing = { body: null, zone: { x: 0, y: 600, w: 1000, h: 400 } };
  // Item 400 × 200 with 400 clearance in front. Its body must stay above y = 600,
  // but its clearance may run into the swing.
  const s = solvePlacement(room, [swing], { w: 400, h: 200, clearance: { front: 400 } });
  // body top y in [0, 400] → 9 rows; x in [0, 600] → 13 cols
  assert.equal(s.count, 13 * 9);

  // The same area as a solid body blocks the clearance too: body top y in [0, 0]
  const solid = { body: { x: 0, y: 600, w: 1000, h: 400 }, zone: null };
  assert.equal(solvePlacement(room, [solid], { w: 400, h: 200, clearance: { front: 400 } }).count, 13 * 1);
});

test('the notch in an L-shaped room is excluded', () => {
  const s = solvePlacement(roomOf(ell), [], { w: 400, h: 400 });
  const inBite = s.regions.some((r) => r.x < 2000 && r.x + r.w > 1500 && r.y < 500);
  assert.equal(inBite, false);
  assert.ok(s.count > 0);
});

test('nearest returns the closest valid centre', () => {
  const room = roomOf(square(2000));
  const block = { body: { x: 500, y: 500, w: 1000, h: 1000 }, zone: null };
  const s = solvePlacement(room, [block], { w: 400, h: 400 });
  const p = s.nearest(1000, 1000);
  assert.ok(p);
  const b = { x: p.x - 200, y: p.y - 200, w: 400, h: 400 };
  assert.equal(rectsOverlap(b, block.body), false);
  // Should be pressed up against the block, i.e. within 250 mm of it on one axis
  const gap = Math.min(Math.abs(b.x + b.w - 500), Math.abs(b.x - 1500), Math.abs(b.y + b.h - 500), Math.abs(b.y - 1500));
  assert.equal(gap, 0);
});

test('rotation changes what fits', () => {
  const room = roomOf([[0, 0], [600, 0], [600, 2000], [0, 2000]]);
  assert.equal(solvePlacement(room, [], { w: 1800, h: 500 }).count, 0);
  assert.ok(solvePlacement(room, [], { w: 1800, h: 500, rotation: 90 }).count > 0);
});
