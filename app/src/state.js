// The one shared state object for the studio, plus the per-panel view records. A panel view says which
// loaded photo it shows and how that photo is framed: pan offsets in -1..1, a zoom multiplier, and
// whether the photo fills the panel (cropping) or fits inside it whole.

import { getLayout } from './layouts.js';

export function makePanel(imgIndex) {
  return { img: imgIndex, ox: 0, oy: 0, zoom: 1, mode: 'fill' };
}

export const state = {
  images: [], // [{ img: HTMLImageElement, name: string }]
  layoutId: 'classic5',
  grade: 'sunset',
  span: false,
  spanIndex: 0,
  selected: 0,
  panels: [],
  title: 'NEON HARBOR',
  caption: 'One city. Five stories. No brakes.',
  textColor: '#ffffff',
  textSize: 1,
  textPos: 'bottom',
};

/** Rebuilds panel views for the current layout, keeping views that still fit and cycling photos. */
export function syncPanels(keep = true) {
  const count = getLayout(state.layoutId).panels.length;
  const next = [];
  for (let i = 0; i < count; i++) {
    if (keep && state.panels[i]) next.push(state.panels[i]);
    else next.push(makePanel(state.images.length ? i % state.images.length : -1));
  }
  state.panels = next;
  if (state.selected >= count) state.selected = 0;
}

/** Assigns photo `imgIndex` to every panel in turn (used when photos first arrive). */
export function dealPhotos() {
  state.panels.forEach((p, i) => {
    if (state.images.length) p.img = i % state.images.length;
  });
  if (state.spanIndex >= state.images.length) state.spanIndex = 0;
}
