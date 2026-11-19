// The cover renderer: paints the whole poster onto any canvas at that canvas's own size, so the
// on-screen preview and every exported PNG share exactly one drawing path. Panels sit on a
// white ground, which is what shows through as the white edges between them.

import { layoutOf } from './layouts.js';
import { gradeOf, gradedPhoto, isPixelGrade, drawGradeOverlay } from './grade.js';
import { drawLettering } from './text.js';

/** The panels' pixel rectangles for a cover of w × h, gutters included in the spacing. */
export function panelRects(state, w, h) {
  const gutter = Math.max(4, Math.round(Math.min(w, h) * 0.009));
  return layoutOf(state.layoutId).slots.map((s) => ({
    x: Math.round(s.x * w + gutter / 2),
    y: Math.round(s.y * h + gutter / 2),
    w: Math.round(s.w * w - gutter),
    h: Math.round(s.h * h - gutter),
    gutter,
  }));
}

/** Which panel (if any) holds the point (px, py) of a w × h cover. */
export function panelAt(state, w, h, px, py) {
  const rects = panelRects(state, w, h);
  return rects.findIndex((r) => px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h);
}

function drawPhoto(ctx, state, photo, transform, clip, frame) {
  const source = gradedPhoto(photo, state.gradeId);
  const sw = source.naturalWidth ?? source.width;
  const sh = source.naturalHeight ?? source.height;
  const base = transform.fit === 'fit'
    ? Math.min(frame.w / sw, frame.h / sh)
    : Math.max(frame.w / sw, frame.h / sh);
  const scale = base * transform.zoom;
  const dw = sw * scale;
  const dh = sh * scale;
  const dx = frame.x + (frame.w - dw) / 2 + transform.offsetX * frame.w;
  const dy = frame.y + (frame.h - dh) / 2 + transform.offsetY * frame.h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(clip.x, clip.y, clip.w, clip.h);
  ctx.clip();
  if (!isPixelGrade(state.gradeId)) {
    const filter = gradeOf(state.gradeId).filter;
    if (filter) ctx.filter = filter;
  }
  ctx.drawImage(source, dx, dy, dw, dh);
  ctx.filter = 'none';
  drawGradeOverlay(ctx, state.gradeId, clip.x, clip.y, clip.w, clip.h);
  ctx.restore();
}

function drawPlaceholder(ctx, rect, index) {
  const g = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
  g.addColorStop(0, '#3b1155');
  g.addColorStop(1, '#8f2160');
  ctx.fillStyle = g;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  const size = Math.max(13, Math.min(rect.w, rect.h) * 0.09);
  ctx.font = `${size}px Anton, sans-serif`;
  ctx.fillText(`PANEL ${index + 1}`, rect.x + rect.w / 2, rect.y + rect.h / 2 - size * 0.2);
  ctx.font = `${size * 0.62}px Anton, sans-serif`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.fillText('ADD A PHOTO', rect.x + rect.w / 2, rect.y + rect.h / 2 + size * 0.75);
  ctx.restore();
}

/**
 * Paints the cover onto ctx at w × h. With opts.selection, the selected panel gets a dashed
 * outline (editor only — exports never show it).
 */
export function renderCover(ctx, state, w, h, opts = {}) {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  const rects = panelRects(state, w, h);
  const full = { x: 0, y: 0, w, h };
  if (state.spanAll) {
    const photo = state.photos[state.spanPhotoIndex];
    for (const rect of rects) {
      if (photo) drawPhoto(ctx, state, photo, state.spanTransform, rect, full);
      else drawPlaceholder(ctx, rect, 0);
    }
  } else {
    rects.forEach((rect, i) => {
      const panel = state.panels[i];
      const photo = panel ? state.photos[panel.photoIndex] : undefined;
      if (photo && panel) drawPhoto(ctx, state, photo, panel, rect, rect);
      else drawPlaceholder(ctx, rect, i);
    });
  }
  // A whisper of vignette to seat the poster.
  const v = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.45, w / 2, h / 2, Math.max(w, h) * 0.78);
  v.addColorStop(0, 'rgba(10, 0, 24, 0)');
  v.addColorStop(1, 'rgba(10, 0, 24, 0.20)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);
  drawLettering(ctx, state, w, h);
  if (opts.selection && !state.spanAll) {
    const rect = rects[state.selectedPanel];
    if (rect) {
      ctx.save();
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = Math.max(2, w * 0.003);
      ctx.setLineDash([w * 0.014, w * 0.01]);
      ctx.strokeRect(rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 2);
      ctx.restore();
    }
  }
}

/** Draws the cover onto a canvas element at the canvas's own size. */
export function drawCover(canvas, state, opts = {}) {
  renderCover(canvas.getContext('2d'), state, canvas.width, canvas.height, opts);
}
