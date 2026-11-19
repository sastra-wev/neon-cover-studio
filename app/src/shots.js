// Fixed scenes for screenshots: ?shot=cover shows the cover alone filling the window; ?shot=editor shows
// the full studio. Query params: layout, grade, title, caption, pos, span=1. The bundled sample photos
// fill the panels. window.__shotReady is set once the scene is painted with the display font loaded.

import { state, syncPanels, dealPhotos } from './state.js';
import { loadImage, render, syncUI } from './ui.js';

export async function runShot(shot, query) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  state.layoutId = query.get('layout') ?? state.layoutId;
  state.grade = query.get('grade') ?? state.grade;
  state.title = query.get('title') ?? state.title;
  state.caption = query.get('caption') ?? state.caption;
  state.textPos = query.get('pos') ?? state.textPos;
  state.span = query.get('span') === '1';
  syncPanels(false);
  if (shot === 'cover') state.selected = -1; // a cover shot is the export itself: no selection marker
  try { await document.fonts.load('80px Anton'); } catch { /* fall back to sans */ }
  for (const name of ['pier', 'boulevard']) {
    const img = await loadImage(`samples/${name}.jpg`);
    state.images.push({ img, name: `${name}.jpg` });
  }
  dealPhotos();
  document.getElementById('title').value = state.title;
  document.getElementById('caption').value = state.caption;
  document.getElementById('textPos').value = state.textPos;
  document.getElementById('span').checked = state.span;
  syncUI();
  render();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
