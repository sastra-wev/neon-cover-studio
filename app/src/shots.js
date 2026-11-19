// Fixed scenes for the screenshots, driven by the query string:
//   ?shot=cover  — one exported cover, full frame (the app adds body.shot-cover to hide the editor)
//   ?shot=editor — the editor with sample photos loaded, panels filled and lettering set
// Shared params: layout, grade, size, title, caption, stars, span=1 and
// photos=pier,boulevard (sample names, assigned to panels in order). The scene is fully painted
// before window.__shotReady flips true, and main.js exposes the real export for the cover shots.

import { addPhoto, syncPanels } from './state.js';
import { layoutOf } from './layouts.js';
import { loadImage } from './ui.js';

const LAYOUT_IDS = ['hero', 'duo', 'trio', 'classic5', 'grid6'];
const GRADE_IDS = ['none', 'sunset', 'neon', 'duotone', 'comic'];
const SIZE_IDS = ['square', 'portrait', 'wide'];

export async function applyShot(state, query) {
  const mode = query.get('shot');
  document.body.classList.add(`shot-${mode}`);
  if (LAYOUT_IDS.includes(query.get('layout'))) state.layoutId = query.get('layout');
  if (GRADE_IDS.includes(query.get('grade'))) state.gradeId = query.get('grade');
  if (SIZE_IDS.includes(query.get('size'))) state.sizeId = query.get('size');
  if (query.get('title') !== null) state.title = query.get('title');
  if (query.get('caption') !== null) state.caption = query.get('caption');
  if (query.get('titleColor')) state.titleColor = query.get('titleColor');
  if (query.get('captionColor')) state.captionColor = query.get('captionColor');
  if (query.get('pos')) state.titlePosition = query.get('pos');
  const stars = Number(query.get('stars'));
  if (Number.isInteger(stars) && stars >= 0 && stars <= 5) state.stars = stars;
  state.spanAll = query.get('span') === '1';

  syncPanels(state, layoutOf(state.layoutId).slots.length);
  const names = (query.get('photos') ?? 'pier,boulevard').split(',').map((s) => s.trim()).filter(Boolean);
  for (const name of names) {
    const img = await loadImage(`samples/${name}.jpg`);
    addPhoto(state, img, `samples/${name}.jpg`, name);
  }
  // Assign the samples across the panels in order, cycling when there are more panels than photos.
  state.panels.forEach((panel, i) => {
    if (state.photos.length) panel.photoIndex = i % state.photos.length;
  });
  if (state.photos.length) state.spanPhotoIndex = 0;
  return mode;
}
