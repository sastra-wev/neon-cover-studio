// Panel layouts as fractions of the cover (x, y, w, h in 0..1). White gutters are drawn between panels
// by the renderer, GTA-poster style: a collage of framed scenes, one hero scene, or clean splits.

export const LAYOUTS = {
  classic5: {
    label: 'Classic 5-panel',
    panels: [
      { x: 0, y: 0, w: 0.46, h: 0.58 },
      { x: 0.46, y: 0, w: 0.54, h: 0.34 },
      { x: 0.46, y: 0.34, w: 0.54, h: 0.24 },
      { x: 0, y: 0.58, w: 0.62, h: 0.42 },
      { x: 0.62, y: 0.58, w: 0.38, h: 0.42 },
    ],
  },
  wide3: {
    label: '3 wide panels',
    panels: [
      { x: 0, y: 0, w: 1, h: 0.36 },
      { x: 0, y: 0.36, w: 1, h: 0.32 },
      { x: 0, y: 0.68, w: 1, h: 0.32 },
    ],
  },
  split2: {
    label: '2-panel split',
    panels: [
      { x: 0, y: 0, w: 0.5, h: 1 },
      { x: 0.5, y: 0, w: 0.5, h: 1 },
    ],
  },
  hero: {
    label: 'Full hero',
    panels: [{ x: 0, y: 0, w: 1, h: 1 }],
  },
};

export function getLayout(id) {
  return LAYOUTS[id] ?? LAYOUTS.classic5;
}

/** Index of the panel containing point (px, py) in 0..1 cover space, or -1. */
export function panelAt(layout, px, py) {
  for (let i = layout.panels.length - 1; i >= 0; i--) {
    const p = layout.panels[i];
    if (px >= p.x && px <= p.x + p.w && py >= p.y && py <= p.y + p.h) return i;
  }
  return -1;
}
