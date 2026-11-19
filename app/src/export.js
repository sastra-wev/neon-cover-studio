// The composer: draws the whole cover (panels, grades, white gutters, lettering) onto any canvas at any
// size, and the PNG export that renders offscreen at the picked size and downloads it. Preview and
// export share this one path, so what you see is exactly what downloads.

import { getLayout } from './layouts.js';
import { applyGrade, gradeFilter } from './grade.js';
import { drawText } from './text.js';

const tmp = document.createElement('canvas');

/** Draws one framed photo into tmp at tw x th, grades it, and returns tmp (or null when no photo). */
function framed(entry, view, tw, th, grade) {
  tmp.width = Math.max(2, Math.round(tw));
  tmp.height = Math.max(2, Math.round(th));
  const c = tmp.getContext('2d');
  c.fillStyle = '#17102a';
  c.fillRect(0, 0, tmp.width, tmp.height);
  if (!entry) {
    c.fillStyle = 'rgba(255,255,255,0.25)';
    c.font = `${Math.round(tmp.height * 0.08)}px sans-serif`;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('DROP A PHOTO', tmp.width / 2, tmp.height / 2);
    return tmp;
  }
  const img = entry.img;
  const base = view.mode === 'fit'
    ? Math.min(tmp.width / img.naturalWidth, tmp.height / img.naturalHeight)
    : Math.max(tmp.width / img.naturalWidth, tmp.height / img.naturalHeight);
  const scale = base * view.zoom;
  const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
  const dx = (tmp.width - dw) / 2 + view.ox * tmp.width * 0.45;
  const dy = (tmp.height - dh) / 2 + view.oy * tmp.height * 0.45;
  c.save();
  c.filter = gradeFilter(grade);
  c.drawImage(img, dx, dy, dw, dh);
  c.restore();
  applyGrade(c, tmp.width, tmp.height, grade);
  return tmp;
}

export function composeCover(canvas, st) {
  const W = canvas.width, H = canvas.height;
  const ctx = canvas.getContext('2d');
  const layout = getLayout(st.layoutId);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);
  if (st.span && st.images[st.spanIndex]) {
    const view = st.panels[0] ?? { ox: 0, oy: 0, zoom: 1, mode: 'fill' };
    const full = framed(st.images[st.spanIndex], view, W, H, st.grade);
    ctx.drawImage(full, 0, 0);
  } else {
    layout.panels.forEach((p, i) => {
      const view = st.panels[i] ?? { img: -1, ox: 0, oy: 0, zoom: 1, mode: 'fill' };
      const entry = st.images[view.img] ?? null;
      const panel = framed(entry, view, p.w * W, p.h * H, st.grade);
      ctx.drawImage(panel, Math.round(p.x * W), Math.round(p.y * H));
    });
  }
  // White gutters: stroke every panel, then a heavier outer frame.
  const gut = Math.max(3, Math.round(W * 0.006));
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = gut;
  for (const p of layout.panels) ctx.strokeRect(p.x * W, p.y * H, p.w * W, p.h * H);
  ctx.lineWidth = gut * 2;
  ctx.strokeRect(0, 0, W, H);
  // Selected panel marker (preview only; export clears the selection first).
  if (st.selected >= 0 && layout.panels[st.selected] && !st.span) {
    const p = layout.panels[st.selected];
    ctx.strokeStyle = '#ffb35c';
    ctx.lineWidth = Math.max(2, gut * 0.7);
    ctx.setLineDash([14, 9]);
    ctx.strokeRect(p.x * W + gut, p.y * H + gut, p.w * W - gut * 2, p.h * H - gut * 2);
    ctx.setLineDash([]);
  }
  drawText(ctx, W, H, st);
}

export function exportPNG(st, w, h, done) {
  const off = document.createElement('canvas');
  off.width = w; off.height = h;
  const clean = { ...st, selected: -1 };
  composeCover(off, clean);
  off.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `neon-cover-${w}x${h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    done(`Saved neon-cover-${w}x${h}.png`);
  }, 'image/png');
}
