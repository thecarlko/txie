// Number formatting that matches architectural drawings: 4 900 × 3 400.

const THIN = '\u2009';

export const mm = (n) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, THIN);
export const dims = (w, h) => `${mm(w)} × ${mm(h)}`;
export const m2 = (a) => a.toFixed(1);
