// The plan: static building geometry plus the furniture that moves around in it.
//
// Rooms, doors and fixtures come from the building definition and never change.
// Furniture is a flat $state array in world coordinates; which room a piece belongs
// to is derived from where its centre sits, and kept up to date as it moves.

import { untrack } from 'svelte';
import {
  bboxOf, bodyRect, doorZone, normaliseClearance, pointInPolygon, polygonArea,
  quarterTurn, rectInPolygon, rectsOverlap, unionRect, zoneRect,
} from './geometry.js';
import { solvePlacement } from './placement.js';

export const SCHEMA = 1;
const HISTORY_LIMIT = 50;
const COALESCE_MS = 800;

const newId = () =>
  globalThis.crypto?.randomUUID?.() ?? `f${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

/**
 * @typedef {{ x: number, y: number, w: number, h: number }} Rect
 * @typedef {{ front: number, back: number, left: number, right: number }} Clearance
 * @typedef {{
 *   id: string, label: string, roomId: string | null,
 *   cx: number, cy: number, w: number, h: number, rotation: 0 | 90 | 180 | 270,
 *   clearance: Clearance | null, status: 'existing' | 'planned', fixed: boolean,
 *   meta: Record<string, unknown>
 * }} Item
 */

export class Plan {
  /** Snap step for dragging and nudging, mm. */
  grid = 50;
  /** Cell size for the placement solver, mm. */
  cell = 50;

  building;
  /** @type {Array<{ id: string, name: string, points: number[][], bbox: Rect, area: number, xs: number[], ys: number[], label?: number[] }>} */
  rooms = [];
  doors = [];
  /** @type {Rect} */
  bbox;

  /** @type {Item[]} */
  items = $state([]);
  selectedRoomId = $state(null);
  selectedItemId = $state(null);

  /**
   * How much clear floor each item needs. Swap this to change every clearance at
   * once, e.g. to apply a wheelchair access profile on top of the stored values.
   * @type {(item: Item) => Partial<Clearance> | number | null}
   */
  clearanceFor = $state.raw((item) => item.clearance);

  past = $state.raw([]);
  future = $state.raw([]);

  #roomIndex = new Map();
  #fixtures = [];
  #pending = null;
  #tag = null;
  #tagAt = 0;

  constructor(building, { saved = null, clearanceFor = null } = {}) {
    this.building = building;
    this.rooms = building.rooms.map((r) => ({
      ...r,
      bbox: bboxOf(r.points),
      area: polygonArea(r.points) / 1e6,
      xs: [...new Set(r.points.map((p) => p[0]))],
      ys: [...new Set(r.points.map((p) => p[1]))],
    }));
    for (const r of this.rooms) this.#roomIndex.set(r.id, r);
    this.bbox = this.rooms.map((r) => r.bbox).reduce(unionRect);

    this.doors = (building.doors ?? []).map((d) => {
      const zone = doorZone(d);
      return { ...d, zone, roomId: this.roomAt(zone.x + zone.w / 2, zone.y + zone.h / 2)?.id ?? null };
    });

    if (clearanceFor) this.clearanceFor = clearanceFor;

    this.#fixtures = (building.fixtures ?? []).map((f) => this.#hydrate({ ...f, fixed: true }));
    const movable = saved?.schema === SCHEMA ? (saved.items ?? []) : [];
    this.items = [...structuredClone(this.#fixtures), ...movable.map((i) => this.#hydrate({ ...i, fixed: false }))];
  }

  // ── Lookups ────────────────────────────────────────────────────────────────

  room(id) {
    return (id && this.#roomIndex.get(id)) || null;
  }

  item(id) {
    return (id && this.items.find((i) => i.id === id)) || null;
  }

  roomAt(x, y) {
    return this.rooms.find((r) => pointInPolygon(x, y, r.points)) ?? null;
  }

  /** The item's top-left corner measured from its room's top-left corner. */
  position(id) {
    const it = this.item(id);
    const room = this.room(it?.roomId);
    if (!it || !room) return null;
    const b = bodyRect(it);
    return { left: b.x - room.bbox.x, top: b.y - room.bbox.y };
  }

  /** Lines a dragged item's edges can snap to: the room's walls and other furniture. */
  snapLines(roomId, excludeId) {
    const room = this.room(roomId);
    if (!room) return { xs: [], ys: [] };
    const xs = [...room.xs], ys = [...room.ys];
    for (const it of this.items) {
      if (it.roomId !== roomId || it.id === excludeId) continue;
      const b = bodyRect(it);
      xs.push(b.x, b.x + b.w);
      ys.push(b.y, b.y + b.h);
    }
    return { xs, ys };
  }

  // ── Derived state ──────────────────────────────────────────────────────────

  selectedRoom = $derived(this.room(this.selectedRoomId));
  selectedItem = $derived(this.items.find((i) => i.id === this.selectedItemId) ?? null);

  /** Map of roomId → items in it. Items outside every room are under the key null. */
  byRoom = $derived.by(() => {
    const m = new Map(this.rooms.map((r) => [r.id, []]));
    m.set(null, []);
    for (const it of this.items) (m.get(it.roomId) ?? m.get(null)).push(it);
    return m;
  });

  /** World-space body and clearance rect for every item. */
  geometry = $derived.by(() => {
    const g = new Map();
    for (const it of this.items) g.set(it.id, { body: bodyRect(it), zone: zoneRect(it, this.clearanceFor(it)) });
    return g;
  });

  /** Map of itemId → human-readable problems. Absent means the piece fits. */
  conflicts = $derived.by(() => {
    const out = new Map();
    const flag = (item, message) => {
      if (item.fixed) return;
      const list = out.get(item.id);
      if (!list) out.set(item.id, [message]);
      else if (!list.includes(message)) list.push(message);
    };
    const geo = this.geometry;

    for (const room of this.rooms) {
      const list = this.byRoom.get(room.id) ?? [];
      const doors = this.doors.filter((d) => d.roomId === room.id);
      for (let i = 0; i < list.length; i++) {
        const a = list[i];
        const ga = geo.get(a.id);
        if (!a.fixed) {
          if (!rectInPolygon(ga.body, room.points)) flag(a, 'Goes through a wall');
          else if (ga.zone && !rectInPolygon(ga.zone, room.points)) flag(a, 'Its clear space runs into a wall');
          for (const d of doors) if (rectsOverlap(ga.body, d.zone)) flag(a, `Blocks the ${d.label ?? 'door'}`);
        }
        for (let j = i + 1; j < list.length; j++) {
          const b = list[j];
          if (a.fixed && b.fixed) continue;
          const gb = geo.get(b.id);
          if (rectsOverlap(ga.body, gb.body)) {
            flag(a, `Overlaps ${b.label}`);
            flag(b, `Overlaps ${a.label}`);
            continue;
          }
          const aInB = !!gb.zone && rectsOverlap(ga.body, gb.zone);
          const bInA = !!ga.zone && rectsOverlap(gb.body, ga.zone);
          if (aInB) {
            flag(a, `In the way of ${b.label}`);
            if (!bInA) flag(b, `${a.label} is in its way`);
          }
          if (bInA) {
            flag(b, `In the way of ${a.label}`);
            if (!aInB) flag(a, `${b.label} is in its way`);
          }
        }
      }
    }
    for (const it of this.byRoom.get(null) ?? []) flag(it, 'Not inside a room');
    return out;
  });

  /**
   * A cheap fingerprint of everything the placement solver depends on. While an item
   * is being dragged its own position changes every frame but this string does not,
   * so the solver only re-runs when something it cares about actually changes.
   */
  placementKey = $derived.by(() => {
    const s = this.selectedItem;
    if (!s || s.fixed || !s.roomId) return '';
    const parts = [s.roomId, s.w, s.h, s.rotation, JSON.stringify(this.clearanceFor(s))];
    for (const it of this.byRoom.get(s.roomId) ?? []) {
      if (it.id !== s.id) parts.push(it.id, it.cx, it.cy, it.w, it.h, it.rotation, JSON.stringify(this.clearanceFor(it)));
    }
    return parts.join('|');
  });

  /** Where the selected item could go in its room. */
  placement = $derived.by(() => {
    if (!this.placementKey) return null;
    return untrack(() => this.solveFor(this.selectedItem));
  });

  get canUndo() {
    return this.past.length > 0;
  }

  get canRedo() {
    return this.future.length > 0;
  }

  /** Run the solver for any item-shaped spec, ignoring one item (usually itself). */
  solveFor(spec, roomId = spec?.roomId, excludeId = spec?.id) {
    const room = this.room(roomId);
    if (!room || !spec) return null;
    const obstacles = [];
    for (const it of this.items) {
      if (it.roomId !== room.id || it.id === excludeId) continue;
      obstacles.push({ body: bodyRect(it), zone: zoneRect(it, this.clearanceFor(it)) });
    }
    for (const d of this.doors) if (d.roomId === room.id) obstacles.push({ body: null, zone: d.zone });
    return solvePlacement(
      room,
      obstacles,
      { w: spec.w, h: spec.h, rotation: spec.rotation, clearance: this.clearanceFor(spec) },
      { cell: this.cell },
    );
  }

  // ── Selection ──────────────────────────────────────────────────────────────

  selectRoom(id) {
    this.selectedRoomId = this.room(id) ? id : null;
    const s = this.selectedItem;
    if (s && s.roomId !== this.selectedRoomId) this.selectedItemId = null;
  }

  selectItem(id) {
    this.selectedItemId = this.item(id) ? id : null;
  }

  // ── Edits ──────────────────────────────────────────────────────────────────

  /**
   * Add a piece to a room at the clear spot nearest the room's centre. If it only
   * fits turned sideways, it is turned. If it fits nowhere it goes in the middle
   * and shows as a conflict.
   */
  add(spec, roomId = this.selectedRoomId) {
    const room = this.room(roomId);
    if (!room) throw new Error(`Unknown room: ${roomId}`);
    const draft = this.#hydrate({
      status: 'planned',
      ...spec,
      fixed: false,
      id: undefined,
      roomId: room.id,
      cx: room.bbox.x + room.bbox.w / 2,
      cy: room.bbox.y + room.bbox.h / 2,
    });

    let spot = this.solveFor(draft, room.id, null)?.nearest(draft.cx, draft.cy) ?? null;
    if (!spot) {
      const turned = { ...draft, rotation: quarterTurn(draft.rotation + 90) };
      spot = this.solveFor(turned, room.id, null)?.nearest(draft.cx, draft.cy) ?? null;
      if (spot) draft.rotation = turned.rotation;
    }
    if (spot) {
      draft.cx = spot.x;
      draft.cy = spot.y;
    }
    this.#settle(draft);

    this.#checkpoint();
    this.items.push(draft);
    this.selectedItemId = draft.id;
    return { id: draft.id, placed: !!spot };
  }

  /** Move without recording history; wrap gestures in beginChange / commitChange. */
  move(id, cx, cy) {
    const it = this.item(id);
    if (!it || it.fixed) return;
    it.cx = cx;
    it.cy = cy;
    this.#settle(it);
    const r = this.roomAt(it.cx, it.cy);
    if (r && r.id !== it.roomId) it.roomId = r.id;
  }

  nudge(id, dx, dy) {
    const it = this.item(id);
    if (!it || it.fixed) return;
    this.#checkpoint(`nudge:${id}`);
    this.move(id, it.cx + dx, it.cy + dy);
  }

  /** Set the item's top-left corner relative to its room's top-left corner. */
  setPosition(id, left, top) {
    const it = this.item(id);
    const room = this.room(it?.roomId);
    if (!it || it.fixed || !room) return;
    const b = bodyRect(it);
    this.#checkpoint();
    this.move(id, it.cx + (room.bbox.x + left - b.x), it.cy + (room.bbox.y + top - b.y));
  }

  rotate(id, by = 90) {
    const it = this.item(id);
    if (!it || it.fixed) return;
    this.#checkpoint(`rotate:${id}`);
    it.rotation = quarterTurn(it.rotation + by);
    this.#settle(it);
  }

  /** Change size, keeping the top-left corner where it is. */
  resize(id, w, h) {
    const it = this.item(id);
    if (!it || it.fixed) return;
    w = Math.max(10, Math.round(Number(w) || 0));
    h = Math.max(10, Math.round(Number(h) || 0));
    if (w === it.w && h === it.h) return;
    this.#checkpoint();
    const before = bodyRect(it);
    it.w = w;
    it.h = h;
    const after = bodyRect(it);
    it.cx += before.x - after.x;
    it.cy += before.y - after.y;
    this.#settle(it);
  }

  /** Label, status, clearance or meta. */
  update(id, patch) {
    const it = this.item(id);
    if (!it || it.fixed) return;
    this.#checkpoint();
    if ('label' in patch) it.label = String(patch.label).trim() || it.label;
    if ('status' in patch) it.status = patch.status === 'planned' ? 'planned' : 'existing';
    if ('clearance' in patch) it.clearance = normaliseClearance(patch.clearance);
    if ('meta' in patch) it.meta = { ...it.meta, ...patch.meta };
  }

  remove(id) {
    const i = this.items.findIndex((x) => x.id === id);
    if (i < 0 || this.items[i].fixed) return;
    this.#checkpoint();
    this.items.splice(i, 1);
    if (this.selectedItemId === id) this.selectedItemId = null;
  }

  /** Move to the closest spot where the piece fits. Returns false if there is none. */
  relocate(id) {
    const it = this.item(id);
    if (!it || it.fixed) return false;
    const spot = this.solveFor(it)?.nearest(it.cx, it.cy);
    if (!spot) return false;
    this.#checkpoint();
    this.move(id, spot.x, spot.y);
    return true;
  }

  // ── History ────────────────────────────────────────────────────────────────

  /** Call at the start of a drag. */
  beginChange() {
    this.#pending = $state.snapshot(this.items);
  }

  /** Call at the end of a drag. Records one undo step if anything moved. */
  commitChange() {
    const before = this.#pending;
    this.#pending = null;
    if (!before || JSON.stringify(before) === JSON.stringify($state.snapshot(this.items))) return;
    this.#push(before);
  }

  undo() {
    if (!this.past.length) return;
    this.future = [$state.snapshot(this.items), ...this.future];
    this.items = structuredClone(this.past.at(-1));
    this.past = this.past.slice(0, -1);
    this.#afterRestore();
  }

  redo() {
    if (!this.future.length) return;
    this.past = [...this.past, $state.snapshot(this.items)];
    this.items = structuredClone(this.future[0]);
    this.future = this.future.slice(1);
    this.#afterRestore();
  }

  // ── Persistence ────────────────────────────────────────────────────────────

  /** The movable furniture as a plain, versioned document. Fixtures come from the building. */
  toJSON() {
    return {
      schema: SCHEMA,
      buildingId: this.building.id,
      items: this.items
        .filter((i) => !i.fixed)
        .map((i) => ({
          id: i.id,
          label: i.label,
          roomId: i.roomId,
          cx: i.cx,
          cy: i.cy,
          w: i.w,
          h: i.h,
          rotation: i.rotation,
          clearance: i.clearance ? { ...i.clearance } : null,
          status: i.status,
          meta: { ...i.meta },
        })),
    };
  }

  /** Replace the furniture with a saved document. Returns false if it doesn't belong here. */
  load(doc) {
    if (!doc || doc.schema !== SCHEMA || !Array.isArray(doc.items)) return false;
    if (doc.buildingId && doc.buildingId !== this.building.id) return false;
    this.items = [...structuredClone(this.#fixtures), ...doc.items.map((i) => this.#hydrate({ ...i, fixed: false }))];
    this.past = [];
    this.future = [];
    this.#tag = null;
    this.#afterRestore();
    return true;
  }

  // ── Internals ──────────────────────────────────────────────────────────────

  #hydrate(i) {
    const cx = Number(i.cx) || 0;
    const cy = Number(i.cy) || 0;
    return {
      id: String(i.id ?? newId()),
      label: String(i.label ?? 'Item'),
      cx,
      cy,
      w: Math.max(10, Number(i.w) || 0),
      h: Math.max(10, Number(i.h) || 0),
      rotation: quarterTurn(i.rotation),
      clearance: normaliseClearance(i.clearance),
      status: i.status === 'planned' && !i.fixed ? 'planned' : 'existing',
      fixed: !!i.fixed,
      roomId: this.room(i.roomId) ? i.roomId : this.roomAt(cx, cy)?.id ?? null,
      meta: i.meta && typeof i.meta === 'object' ? { ...i.meta } : {},
    };
  }

  /** Keep the footprint's edges on whole millimetres. */
  #settle(it) {
    const b = bodyRect(it);
    it.cx += Math.round(b.x) - b.x;
    it.cy += Math.round(b.y) - b.y;
  }

  /** Record an undo step. Repeated taps of the same key within a moment share one step. */
  #checkpoint(tag = null) {
    const now = Date.now();
    if (tag && tag === this.#tag && now - this.#tagAt < COALESCE_MS) {
      this.#tagAt = now;
      return;
    }
    this.#tag = tag;
    this.#tagAt = now;
    this.#push($state.snapshot(this.items));
  }

  #push(snapshot) {
    this.past = [...this.past.slice(-(HISTORY_LIMIT - 1)), snapshot];
    this.future = [];
  }

  #afterRestore() {
    this.#tag = null;
    if (!this.item(this.selectedItemId)) this.selectedItemId = null;
  }
}
