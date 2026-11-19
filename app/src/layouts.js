// Poster layouts as normalised rectangles (fractions of the whole cover, in reading order).
// The white gutters between panels are the renderer's job; a layout only says where panels sit.

function grid(cols, rows) {
  const slots = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) slots.push({ x: c / cols, y: r / rows, w: 1 / cols, h: 1 / rows });
  }
  return slots;
}

export const LAYOUTS = [
  { id: 'hero', name: 'Hero', detail: '1 full panel', slots: [{ x: 0, y: 0, w: 1, h: 1 }] },
  {
    id: 'duo', name: 'Split', detail: '2 panels',
    slots: [{ x: 0, y: 0, w: 0.5, h: 1 }, { x: 0.5, y: 0, w: 0.5, h: 1 }],
  },
  {
    id: 'trio', name: 'Wide bands', detail: '3 panels',
    slots: [
      { x: 0, y: 0, w: 1, h: 1 / 3 },
      { x: 0, y: 1 / 3, w: 1, h: 1 / 3 },
      { x: 0, y: 2 / 3, w: 1, h: 1 / 3 },
    ],
  },
  {
    id: 'classic5', name: 'Classic', detail: '5 panels',
    slots: [
      { x: 0, y: 0, w: 0.62, h: 0.54 },
      { x: 0.62, y: 0, w: 0.38, h: 0.54 },
      { x: 0, y: 0.54, w: 0.34, h: 0.46 },
      { x: 0.34, y: 0.54, w: 0.33, h: 0.46 },
      { x: 0.67, y: 0.54, w: 0.33, h: 0.46 },
    ],
  },
  { id: 'grid6', name: 'Mosaic', detail: '6 panels', slots: grid(3, 2) },
];

export function layoutOf(id) {
  return LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[3];
}
