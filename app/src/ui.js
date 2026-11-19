// Page wiring: photo intake (picker + drag & drop), layout / grade / panel / text controls, canvas
// dragging and wheel zoom, and the export buttons. Everything re-renders through composeCover.

import { state, syncPanels, dealPhotos } from './state.js';
import { LAYOUTS, getLayout, panelAt } from './layouts.js';
import { GRADES } from './grade.js';
import { composeCover, exportPNG } from './export.js';

const $ = (id) => document.getElementById(id);
const canvas = $('cover');

export function render() { composeCover(canvas, state); }

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function addPhotos(sources) {
  for (const s of sources) {
    const img = await loadImage(s.url);
    state.images.push({ img, name: s.name });
  }
  if (state.images.length === sources.length) dealPhotos(); // first batch: fill the panels in turn
  syncUI();
  render();
}

function photoOptions(select, allowNone) {
  select.innerHTML = '';
  if (allowNone) select.add(new Option('— none —', '-1'));
  state.images.forEach((e, i) => select.add(new Option(`${i + 1}. ${e.name}`, String(i))));
}

export function syncUI() {
  const strip = $('strip');
  strip.innerHTML = '';
  state.images.forEach((e, i) => {
    const fig = document.createElement('figure');
    if (i === (state.span ? state.spanIndex : state.panels[state.selected]?.img)) fig.className = 'on';
    const im = document.createElement('img');
    im.src = e.img.src; im.alt = e.name;
    const cap = document.createElement('figcaption');
    cap.textContent = `${i + 1}. ${e.name}`;
    fig.append(im, cap);
    fig.title = 'Click: show in the selected panel';
    fig.addEventListener('click', () => {
      if (state.span) state.spanIndex = i;
      else if (state.panels[state.selected]) state.panels[state.selected].img = i;
      syncUI(); render();
    });
    strip.append(fig);
  });
  photoOptions($('spanPhoto'), false);
  $('spanPhoto').value = String(state.spanIndex);
  $('spanRow').hidden = !state.span;
  photoOptions($('panelPhoto'), true);
  const view = state.panels[state.selected];
  if (view) {
    $('panelPhoto').value = String(view.img);
    $('zoom').value = String(view.zoom);
    $('modeFill').classList.toggle('on', view.mode === 'fill');
    $('modeFit').classList.toggle('on', view.mode === 'fit');
  }
  $('panelName').textContent = state.span
    ? 'One photo spans all panels — drag on the canvas to move it.'
    : `Panel ${state.selected + 1} of ${state.panels.length} selected — drag it on the canvas, scroll to zoom.`;
  document.querySelectorAll('#layouts button').forEach((b) => b.classList.toggle('on', b.dataset.layout === state.layoutId));
  document.querySelectorAll('#grades button').forEach((b) => b.classList.toggle('on', b.dataset.grade === state.grade));
}

function buttonGrid(el, entries, attr, onPick) {
  for (const [id, def] of entries) {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = def.label; b.dataset[attr] = id;
    b.addEventListener('click', () => { onPick(id); syncUI(); render(); });
    el.append(b);
  }
}

export function initUI() {
  buttonGrid($('layouts'), Object.entries(LAYOUTS), 'layout', (id) => { state.layoutId = id; syncPanels(); });
  buttonGrid($('grades'), Object.entries(GRADES), 'grade', (id) => { state.grade = id; });

  const drop = $('drop'), files = $('files');
  drop.addEventListener('click', () => files.click());
  drop.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') files.click(); });
  files.addEventListener('change', () => {
    addPhotos([...files.files].map((f) => ({ url: URL.createObjectURL(f), name: f.name })));
    files.value = '';
  });
  for (const ev of ['dragover', 'dragenter']) drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('over'); });
  for (const ev of ['dragleave', 'drop']) drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('over'); });
  drop.addEventListener('drop', (e) => {
    const list = [...e.dataTransfer.files].filter((f) => f.type.startsWith('image/'));
    addPhotos(list.map((f) => ({ url: URL.createObjectURL(f), name: f.name })));
  });

  $('span').addEventListener('change', (e) => { state.span = e.target.checked; syncUI(); render(); });
  $('spanPhoto').addEventListener('change', (e) => { state.spanIndex = Number(e.target.value); syncUI(); render(); });
  $('panelPhoto').addEventListener('change', (e) => {
    if (state.panels[state.selected]) state.panels[state.selected].img = Number(e.target.value);
    syncUI(); render();
  });
  $('zoom').addEventListener('input', (e) => {
    const v = state.panels[state.span ? 0 : state.selected];
    if (v) { v.zoom = Number(e.target.value); render(); }
  });
  $('modeFill').addEventListener('click', () => { const v = state.panels[state.selected]; if (v) { v.mode = 'fill'; syncUI(); render(); } });
  $('modeFit').addEventListener('click', () => { const v = state.panels[state.selected]; if (v) { v.mode = 'fit'; syncUI(); render(); } });
  $('resetView').addEventListener('click', () => {
    const v = state.panels[state.span ? 0 : state.selected];
    if (v) { v.ox = 0; v.oy = 0; v.zoom = 1; syncUI(); render(); }
  });

  $('title').addEventListener('input', (e) => { state.title = e.target.value; render(); });
  $('caption').addEventListener('input', (e) => { state.caption = e.target.value; render(); });
  $('textColor').addEventListener('input', (e) => { state.textColor = e.target.value; render(); });
  $('textSize').addEventListener('input', (e) => { state.textSize = Number(e.target.value); render(); });
  $('textPos').addEventListener('change', (e) => { state.textPos = e.target.value; render(); });

  document.querySelectorAll('[data-export]').forEach((b) => b.addEventListener('click', () => {
    const [w, h] = b.dataset.export.split('x').map(Number);
    exportPNG(state, w, h, (msg) => { $('status').textContent = msg; });
  }));

  // Canvas drag to pan + wheel to zoom, per panel.
  let drag = null;
  const pos = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  };
  canvas.addEventListener('pointerdown', (e) => {
    const p = pos(e);
    if (!state.span) {
      const hit = panelAt(getLayout(state.layoutId), p.x, p.y);
      if (hit >= 0 && hit !== state.selected) { state.selected = hit; syncUI(); }
    }
    drag = { x: p.x, y: p.y };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const p = pos(e);
    const view = state.panels[state.span ? 0 : state.selected];
    if (view) {
      view.ox = Math.min(1, Math.max(-1, view.ox + (p.x - drag.x) * 1.6));
      view.oy = Math.min(1, Math.max(-1, view.oy + (p.y - drag.y) * 1.6));
      render();
    }
    drag = p;
  });
  const endDrag = () => { drag = null; };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const p = pos(e);
    let idx = state.span ? 0 : panelAt(getLayout(state.layoutId), p.x, p.y);
    if (idx < 0) idx = state.selected;
    const view = state.panels[idx];
    if (view) {
      view.zoom = Math.min(3, Math.max(1, view.zoom * (e.deltaY < 0 ? 1.08 : 0.93)));
      if (!state.span && idx !== state.selected) { state.selected = idx; }
      syncUI(); render();
    }
  }, { passive: false });

  syncPanels(false);
  syncUI();
  render();
}

/** Loads the two bundled sample photos so the studio opens with filled panels. */
export async function loadSamples() {
  await addPhotos([
    { url: 'samples/pier.jpg', name: 'pier.jpg' },
    { url: 'samples/boulevard.jpg', name: 'boulevard.jpg' },
  ]);
}
