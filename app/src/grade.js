// Color grades, applied on an offscreen canvas that already holds one panel's framed photo.
// Sunset and neon grades are filter + tint overlays; duotone and comic grades rewrite pixels.

export const GRADES = {
  none: { label: 'No grade' },
  sunset: { label: 'Sunset Vice' },
  neon: { label: 'Neon Night' },
  duotone: { label: 'Duotone' },
  comic: { label: 'B&W Comic' },
};

function overlay(ctx, w, h, stops, mode = 'source-atop') {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  for (const [at, color] of stops) g.addColorStop(at, color);
  ctx.save();
  ctx.globalCompositeOperation = mode;
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function pixels(ctx, w, h, fn) {
  const data = ctx.getImageData(0, 0, w, h);
  const d = data.data;
  for (let i = 0; i < d.length; i += 4) fn(d, i);
  ctx.putImageData(data, 0, 0);
}

const lum = (d, i) => (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) / 255;

/** Applies grade `id` to the whole of ctx's canvas (w x h). `baseFilter` is set by the caller on draw. */
export function applyGrade(ctx, w, h, id) {
  if (id === 'sunset') {
    overlay(ctx, w, h, [
      [0, 'rgba(255,170,60,0.10)'],
      [0.55, 'rgba(255,90,60,0.16)'],
      [1, 'rgba(205,25,120,0.42)'],
    ]);
  } else if (id === 'neon') {
    overlay(ctx, w, h, [
      [0, 'rgba(0,229,255,0.20)'],
      [0.5, 'rgba(20,0,60,0.12)'],
      [1, 'rgba(255,0,160,0.34)'],
    ]);
    overlay(ctx, w, h, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(2,0,18,0.35)']]);
  } else if (id === 'duotone') {
    const lo = [16, 6, 44], hi = [255, 196, 66], mid = [232, 49, 130];
    pixels(ctx, w, h, (d, i) => {
      const t = lum(d, i);
      const a = t < 0.5 ? lo : mid, b = t < 0.5 ? mid : hi, k = t < 0.5 ? t * 2 : (t - 0.5) * 2;
      d[i] = a[0] + (b[0] - a[0]) * k;
      d[i + 1] = a[1] + (b[1] - a[1]) * k;
      d[i + 2] = a[2] + (b[2] - a[2]) * k;
    });
  } else if (id === 'comic') {
    pixels(ctx, w, h, (d, i) => {
      let v = lum(d, i);
      v = Math.min(1, Math.max(0, (v - 0.5) * 1.5 + 0.5)); // punch the contrast
      v = Math.round(v * 6) / 6; // posterize into ink steps
      const g = Math.round(v * 255);
      d[i] = g; d[i + 1] = g; d[i + 2] = g;
    });
  }
}

/** The CSS-like canvas filter paired with a grade, applied while a photo is drawn. */
export function gradeFilter(id) {
  if (id === 'sunset') return 'saturate(1.35) contrast(1.07) brightness(1.04)';
  if (id === 'neon') return 'saturate(1.65) contrast(1.16) brightness(0.98)';
  if (id === 'duotone') return 'saturate(1.1) contrast(1.05)';
  if (id === 'comic') return 'contrast(1.1)';
  return 'none';
}
