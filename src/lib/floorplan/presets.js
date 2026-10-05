// Starting sizes for common pieces. w is the width across the front, h the depth.
// Clearance is the free floor each needs to be usable; tune these to your access
// profile. Everything here is editable after adding.

export const PRESETS = [
  { key: 'sofa', label: 'Sofa', w: 2000, h: 900, clearance: { front: 600 } },
  { key: 'armchair', label: 'Armchair', w: 850, h: 850, clearance: { front: 600 } },
  { key: 'coffee-table', label: 'Coffee table', w: 1100, h: 550, clearance: null },
  { key: 'dining-table', label: 'Dining table', w: 1600, h: 900, clearance: { front: 700, back: 700 } },
  { key: 'desk', label: 'Desk', w: 1400, h: 700, clearance: { front: 800 } },
  { key: 'double-bed', label: 'Double bed', w: 1350, h: 1900, clearance: { front: 600 } },
  { key: 'single-bed', label: 'Single bed', w: 900, h: 1900, clearance: { front: 600 } },
  { key: 'wardrobe', label: 'Wardrobe', w: 1000, h: 600, clearance: { front: 700 } },
  { key: 'drawers', label: 'Chest of drawers', w: 900, h: 450, clearance: { front: 600 } },
  { key: 'bookcase', label: 'Bookcase', w: 800, h: 300, clearance: { front: 500 } },
  { key: 'custom', label: 'Custom size', w: 1000, h: 600, clearance: null },
];
