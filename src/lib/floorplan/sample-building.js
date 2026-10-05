// Sample data, approximated from Sheet 03 of Flat 12, Maren House. Replace with
// geometry traced from your master schematics.
//
// Rooms are internal faces of walls, in mm, all in one coordinate space.
// Fixtures are built-in items (worktops, sanitaryware) that the plan treats as
// obstacles but never lets anyone move. Doors are hinge / closed-leaf end /
// open-leaf end; their swing is kept clear automatically.

export const marenHouseFlat12 = {
  id: 'maren-house-flat-12',
  name: 'Flat 12, Maren House',
  wallThickness: 100,

  rooms: [
    {
      id: 'living',
      name: 'Living room',
      // The notch along the top wall is a chimney breast.
      points: [[0, 0], [1900, 0], [1900, 350], [2900, 350], [2900, 0], [4900, 0], [4900, 3400], [0, 3400]],
    },
    { id: 'bedroom', name: 'Bedroom', points: [[0, 3400], [3300, 3400], [3300, 7600], [0, 7600]] },
    { id: 'hall', name: 'Hall', points: [[3300, 3400], [4200, 3400], [4200, 7000], [3300, 7000]] },
    { id: 'kitchen', name: 'Kitchen', points: [[4200, 3400], [6500, 3400], [6500, 6100], [4200, 6100]] },
    { id: 'bathroom', name: 'Bathroom', points: [[4200, 6100], [5900, 6100], [5900, 8150], [4200, 8150]] },
  ],

  doors: [
    { label: 'front door', hinge: [3350, 7000], to: [4150, 7000], swing: [3350, 6200] },
    { label: 'living room door', hinge: [3350, 3400], to: [4150, 3400], swing: [3350, 2600] },
    { label: 'kitchen door', hinge: [4200, 4300], to: [4200, 5100], swing: [5000, 4300] },
    { label: 'bedroom door', hinge: [3300, 6000], to: [3300, 6800], swing: [2500, 6000] },
    { label: 'bathroom door', hinge: [4200, 6150], to: [4200, 6900], swing: [4950, 6150] },
  ],

  fixtures: [
    { id: 'fx-worktop-n', label: 'Worktop and hob', cx: 5350, cy: 3700, w: 2300, h: 600, rotation: 0, clearance: { front: 1000 } },
    { id: 'fx-worktop-e', label: 'Worktop and sink', cx: 6200, cy: 5050, w: 2100, h: 600, rotation: 90, clearance: { front: 1000 } },
    { id: 'fx-bath', label: 'Bath', cx: 5050, cy: 7800, w: 1700, h: 700, rotation: 180, clearance: { front: 600 } },
    { id: 'fx-wc', label: 'WC', cx: 5575, cy: 6450, w: 400, h: 650, rotation: 90, clearance: { front: 800 } },
    { id: 'fx-basin', label: 'Basin', cx: 5700, cy: 7050, w: 500, h: 400, rotation: 90, clearance: { front: 600 } },
    { id: 'fx-wardrobe', label: 'Built-in wardrobe', cx: 3000, cy: 4300, w: 1800, h: 600, rotation: 90, clearance: { front: 700 } },
  ],
};

// Furniture already in the flat, as a saved layout document.
export const marenHouseFlat12Layout = {
  schema: 1,
  buildingId: 'maren-house-flat-12',
  items: [
    { id: 'bed', label: 'Double bed', cx: 950, cy: 5175, w: 1350, h: 1900, rotation: 270, clearance: { front: 600 }, status: 'existing' },
    { id: 'bedside', label: 'Bedside table', cx: 200, cy: 4225, w: 450, h: 400, rotation: 270, status: 'existing' },
    { id: 'sofa', label: 'Sofa', cx: 450, cy: 1800, w: 2000, h: 900, rotation: 270, clearance: { front: 600 }, status: 'existing' },
    { id: 'coffee', label: 'Coffee table', cx: 1775, cy: 1800, w: 1100, h: 550, rotation: 90, status: 'existing' },
    { id: 'armchair', label: 'Armchair', cx: 3500, cy: 575, w: 850, h: 850, rotation: 0, clearance: { front: 600 }, status: 'existing' },
    { id: 'tv', label: 'TV unit', cx: 4675, cy: 2000, w: 1600, h: 450, rotation: 90, clearance: { front: 600 }, status: 'existing' },
  ],
};
