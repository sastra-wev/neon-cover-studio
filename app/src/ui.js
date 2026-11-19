// The editor: builds the layout, grade and size buttons, the photo tray and the panel controls,
// and turns canvas drags and wheel turns into panel placements. Every change repaints the cover
// through the redraw callback main.js hands in.

import { EXPORT_SIZES, activeTransform, addPhoto, removePhoto } from './state.js';
import { LAYOUTS, layoutOf } from './layouts.js';
import { GRADES } from './grade.js';
import { panelAt } from './cover.js';
import { syncPanels } from './state.js';
import { exportPng } from './export.js';

const $ = (id) => document.getElementById(id);

/** Loads an image from a URL (object URL or a local sample path), resolving once decoded. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** Loads the two bundled sample photos (made with an image model, free to use). */
export async function loadSamples(state) {
  for (const name of ['pier', 'boulevard']) {
    if (state.photos.some((p) => p.name === name)) continue;
    const img = await loadImage(`samples/${name}.jpg`);
    addPhoto(state, img, `samples/${name}.jpg`, name);
  }
}

export function initEditor(state, canvas, redraw) {
  const status = $('status');
  const say = (msg) => { status.textContent = msg; };

  // ---- layout, grade and size button bars ---------------------------------------------
  const layoutBar = $('layoutBar');
  for (const layout of LAYOUTS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.dataset.layout = layout.id;
    b.textContent = `${layout.name} · ${layout.detail}`;
    b.addEventListener('click', () => {
      state.layoutId = layout.id;
      syncPanels(state, layout.slots.length);
      refresh();
      redraw();
    });
    layoutBar.appendChild(b);
  }
  const gradeBar = $('gradeBar');
  for (const grade of GRADES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.dataset.grade = grade.id;
    b.textContent = grade.name;
    b.addEventListener('click', () => {
      state.gradeId = grade.id;
      refresh();
      redraw();
    });
    gradeBar.appendChild(b);
  }
  const sizeBar = $('sizeBar');
  for (const size of EXPORT_SIZES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.dataset.size = size.id;
    b.textContent = size.label;
    b.addEventListener('click', () => {
      state.sizeId = size.id;
      canvas.width = size.width;
      canvas.height = size.height;
      refresh();
      redraw();
    });
    sizeBar.appendChild(b);
  }

  // ---- photo tray ----------------------------------------------------------------------
  const thumbs = $('thumbs');
  function refreshThumbs() {
    thumbs.innerHTML = '';
    state.photos.forEach((photo, i) => {
      const cell = document.createElement('div');
      cell.className = 'thumb';
      const img = document.createElement('img');
      img.src = photo.url;
      img.alt = photo.name;
      img.title = state.spanAll ? 'Use as the spanning photo' : 'Put in the selected panel';
      img.addEventListener('click', () => {
        if (state.spanAll) state.spanPhotoIndex = i;
        else if (state.panels[state.selectedPanel]) state.panels[state.selectedPanel].photoIndex = i;
        refresh();
        redraw();
      });
      const x = document.createElement('button');
      x.type = 'button';
      x.className = 'thumb-x';
      x.textContent = '×';
      x.title = 'Remove photo';
      x.addEventListener('click', () => {
        removePhoto(state, i);
        refresh();
        redraw();
      });
      cell.append(img, x);
      thumbs.appendChild(cell);
    });
    $('trayHint').textContent = state.photos.length
      ? (state.spanAll ? 'Tap a photo to span it across all panels.' : 'Tap a photo to put it in the selected panel.')
      : 'No photos yet — drop some above, or load the samples.';
  }

  async function takeFiles(files) {
    const images = [...files].filter((f) => f.type.startsWith('image/'));
    if (!images.length) return;
    for (const file of images) {
      const url = URL.createObjectURL(file);
      try {
        const img = await loadImage(url);
        addPhoto(state, img, url, file.name);
      } catch {
        URL.revokeObjectURL(url);
      }
    }
    say(`${state.photos.length} photo${state.photos.length === 1 ? '' : 's'} loaded — nothing left your machine.`);
    refresh();
    redraw();
  }

  $('photoInput').addEventListener('change', (e) => takeFiles(e.target.files ?? []));
  $('sampleBtn').addEventListener('click', async () => {
    await loadSamples(state);
    say('Sample photos loaded.');
    refresh();
    redraw();
  });
  $('spanToggle').addEventListener('change', (e) => {
    state.spanAll = e.target.checked;
    refresh();
    redraw();
  });

  // Drag & drop onto the whole stage.
  const stage = $('stage');
  for (const evt of ['dragenter', 'dragover']) {
    stage.addEventListener(evt, (e) => {
      e.preventDefault();
      stage.classList.add('dropping');
    });
  }
  for (const evt of ['dragleave', 'drop']) {
    stage.addEventListener(evt, (e) => {
      e.preventDefault();
      stage.classList.remove('dropping');
    });
  }
  stage.addEventListener('drop', (e) => takeFiles(e.dataTransfer?.files ?? []));

  // ---- panel editor ----------------------------------------------------------------------
  const zoom = $('zoomRange');
  const panelName = $('panelName');
  function refreshPanelEditor() {
    const t = activeTransform(state);
    panelName.textContent = state.spanAll
      ? 'Spanning photo — drag the cover to move it'
      : `Panel ${state.selectedPanel + 1} of ${layoutOf(state.layoutId).slots.length} — drag it on the cover`;
    zoom.value = String(t.zoom);
    $('fitFill').classList.toggle('on', t.fit === 'fill');
    $('fitFit').classList.toggle('on', t.fit === 'fit');
  }
  zoom.addEventListener('input', () => {
    activeTransform(state).zoom = Number(zoom.value);
    redraw();
  });
  $('fitFill').addEventListener('click', () => { activeTransform(state).fit = 'fill'; refreshPanelEditor(); redraw(); });
  $('fitFit').addEventListener('click', () => { activeTransform(state).fit = 'fit'; refreshPanelEditor(); redraw(); });
  $('resetPanel').addEventListener('click', () => {
    const t = activeTransform(state);
    t.offsetX = 0;
    t.offsetY = 0;
    t.zoom = 1;
    refreshPanelEditor();
    redraw();
  });

  // Drag a photo inside its panel; wheel zooms the panel under the pointer.
  let drag = null;
  const toCover = (e) => {
    const r = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (canvas.width / r.width),
      y: (e.clientY - r.top) * (canvas.height / r.height),
      sx: canvas.width / r.width,
    };
  };
  canvas.addEventListener('pointerdown', (e) => {
    const p = toCover(e);
    if (!state.spanAll) {
      const hit = panelAt(state, canvas.width, canvas.height, p.x, p.y);
      if (hit >= 0 && hit !== state.selectedPanel) {
        state.selectedPanel = hit;
        refresh();
      }
    }
    const t = activeTransform(state);
    drag = { startX: p.x, startY: p.y, offX: t.offsetX, offY: t.offsetY, scale: p.sx };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const p = toCover(e);
    const t = activeTransform(state);
    // Offsets are fractions of the cover, so cover-pixel deltas divide by the cover's size.
    t.offsetX = drag.offX + (p.x - drag.startX) / canvas.width;
    t.offsetY = drag.offY + (p.y - drag.startY) / canvas.height;
    redraw();
  });
  const endDrag = () => { drag = null; };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const p = toCover(e);
    if (!state.spanAll) {
      const hit = panelAt(state, canvas.width, canvas.height, p.x, p.y);
      if (hit >= 0) state.selectedPanel = hit;
    }
    const t = activeTransform(state);
    t.zoom = Math.min(4, Math.max(0.2, t.zoom * (e.deltaY < 0 ? 1.09 : 0.92)));
    refreshPanelEditor();
    redraw();
  }, { passive: false });

  // ---- lettering controls ------------------------------------------------------------------
  const bind = (id, apply) => $(id).addEventListener('input', (e) => { apply(e.target); redraw(); });
  bind('titleInput', (el) => { state.title = el.value; });
  bind('captionInput', (el) => { state.caption = el.value; });
  bind('titleColor', (el) => { state.titleColor = el.value; });
  bind('captionColor', (el) => { state.captionColor = el.value; });
  bind('titleSize', (el) => { state.titleScale = Number(el.value); });
  bind('starsRange', (el) => { state.stars = Number(el.value); $('starsLabel').textContent = String(state.stars); });
  $('titlePos').addEventListener('change', (e) => { state.titlePosition = e.target.value; redraw(); });

  // ---- export --------------------------------------------------------------------------------
  $('exportBtn').addEventListener('click', () => {
    exportPng(state, state.sizeId, (size) => say(`Saved neon-cover-${size.width}x${size.height}.png`));
  });

  function refresh() {
    for (const b of layoutBar.children) b.classList.toggle('on', b.dataset.layout === state.layoutId);
    for (const b of gradeBar.children) b.classList.toggle('on', b.dataset.grade === state.gradeId);
    for (const b of sizeBar.children) b.classList.toggle('on', b.dataset.size === state.sizeId);
    $('spanToggle').checked = state.spanAll;
    refreshThumbs();
    refreshPanelEditor();
  }
  refresh();
  return { refresh, say };
}
