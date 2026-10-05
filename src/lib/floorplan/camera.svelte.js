// The camera is a rectangle in world millimetres bound to the SVG viewBox.
// Zooming to a room is tweening that rectangle; nothing else moves.
//
// fitRect always widens the target to the container's aspect ratio. That means the
// SVG never letterboxes, so screen → world is plain arithmetic (toWorld below)
// instead of getScreenCTM() on every pointermove.

import { Tween, prefersReducedMotion } from 'svelte/motion';
import { cubicOut } from 'svelte/easing';

const DURATION = 420;

export function fitRect(bbox, aspect, pad = 0) {
  let x = bbox.x - pad, y = bbox.y - pad, w = bbox.w + pad * 2, h = bbox.h + pad * 2;
  if (!(aspect > 0) || !(w > 0) || !(h > 0)) return { x, y, w: Math.max(w, 1), h: Math.max(h, 1) };
  if (w / h > aspect) {
    const nh = w / aspect;
    y -= (nh - h) / 2;
    h = nh;
  } else {
    const nw = h * aspect;
    x -= (nw - w) / 2;
    w = nw;
  }
  return { x, y, w, h };
}

export class Camera {
  /** Container size in CSS pixels; bind these to the wrapper element. */
  width = $state(0);
  height = $state(0);

  #tween = new Tween({ x: 0, y: 0, w: 1000, h: 1000 }, { duration: DURATION, easing: cubicOut });

  get aspect() {
    return this.width > 0 && this.height > 0 ? this.width / this.height : 1;
  }

  /** The current viewBox, mid-animation included. */
  get view() {
    return this.#tween.current;
  }

  /** World millimetres per screen pixel. Use it to keep strokes and labels a constant on-screen size. */
  get mmPerPx() {
    return this.width > 0 ? this.#tween.current.w / this.width : 1;
  }

  fit(bbox, { pad = 0, instant = false } = {}) {
    const duration = instant || prefersReducedMotion.current ? 0 : DURATION;
    return this.#tween.set(fitRect(bbox, this.aspect, pad), { duration });
  }

  jump(view) {
    return this.#tween.set(view, { duration: 0 });
  }

  /** rect is the SVG's getBoundingClientRect(), cached for the length of a gesture. */
  toWorld(clientX, clientY, rect) {
    const v = this.view;
    return {
      x: v.x + ((clientX - rect.left) / rect.width) * v.w,
      y: v.y + ((clientY - rect.top) / rect.height) * v.h,
    };
  }

  panBy(dxPx, dyPx) {
    const v = this.view, k = this.mmPerPx;
    this.jump({ x: v.x - dxPx * k, y: v.y - dyPx * k, w: v.w, h: v.h });
  }

  /** Zoom by factor, keeping the world point under the cursor fixed. */
  zoomAt(factor, clientX, clientY, rect, { min = 300, max = Infinity } = {}) {
    const v = this.view;
    const w = Math.min(max, Math.max(min, v.w * factor));
    const k = w / v.w;
    const p = this.toWorld(clientX, clientY, rect);
    this.jump({ x: p.x - (p.x - v.x) * k, y: p.y - (p.y - v.y) * k, w, h: v.h * k });
  }
}
