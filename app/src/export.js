// PNG export: the cover is rendered once more on an offscreen canvas at the chosen post size
// and saved by the browser. The blob is made locally — a photo is never uploaded anywhere.

import { renderCover } from './cover.js';
import { EXPORT_SIZES } from './state.js';

export function sizeOf(id) {
  return EXPORT_SIZES.find((s) => s.id === id) ?? EXPORT_SIZES[0];
}

/** Renders the cover at a post size onto a fresh canvas and returns it. */
export function renderToCanvas(state, sizeId) {
  const size = sizeOf(sizeId);
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  renderCover(canvas.getContext('2d'), state, size.width, size.height);
  return canvas;
}

/** Downloads the cover as a PNG at the given post size; onDone(size) reports the save. */
export function exportPng(state, sizeId, onDone) {
  const size = sizeOf(sizeId);
  renderToCanvas(state, sizeId).toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `neon-cover-${size.width}x${size.height}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    if (onDone) onDone(size);
  }, 'image/png');
}

/** The same export as a data URL — used by the screenshot scenes and the browser test. */
export function exportDataUrl(state, sizeId) {
  return renderToCanvas(state, sizeId).toDataURL('image/png');
}
