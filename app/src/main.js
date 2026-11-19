// Neon Cover Studio — entry point. Wires the state, the editor and the canvas together, loads
// the vendored Anton face before the first paint, and sets up the fixed ?shot= scenes the
// screenshots are taken from. Everything runs locally; no request ever leaves the tab.

import { createState, syncPanels, exportSizeOf } from './state.js';
import { layoutOf } from './layouts.js';
import { drawCover } from './cover.js';
import { initEditor } from './ui.js';
import { applyShot } from './shots.js';
import { exportDataUrl, renderToCanvas } from './export.js';

const canvas = document.getElementById('cover');
const state = createState();
syncPanels(state, layoutOf(state.layoutId).slots.length);

let editor = null;
function redraw() {
  drawCover(canvas, state, { selection: Boolean(editor) && !document.body.classList.contains('shot-cover') });
}

function fitCanvasToSize() {
  const size = exportSizeOf(state);
  canvas.width = size.width;
  canvas.height = size.height;
}

// A handle for the screenshot scenes and the browser test: the app's real export, on demand.
window.NeonCoverStudio = {
  state,
  redraw,
  exportDataUrl: (sizeId) => exportDataUrl(state, sizeId ?? state.sizeId),
  exportCanvas: (sizeId) => renderToCanvas(state, sizeId ?? state.sizeId),
};

const query = new URLSearchParams(location.search);
try {
  await document.fonts.load('100px Anton');
  await document.fonts.ready;
} catch { /* the fallback face still letters the cover */ }

if (query.get('shot')) {
  await applyShot(state, query);
  fitCanvasToSize();
  redraw();
  // Editor scenes keep the controls in step with the scene the query described.
  if (query.get('shot') === 'editor') {
    editor = initEditor(state, canvas, redraw);
    document.getElementById('titleInput').value = state.title;
    document.getElementById('captionInput').value = state.caption;
    editor.refresh();
    redraw();
  }
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
} else {
  fitCanvasToSize();
  editor = initEditor(state, canvas, redraw);
  redraw();
}
