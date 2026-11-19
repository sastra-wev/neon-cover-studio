// Colour grades, all painted on the canvas in this tab. The light grades are a canvas filter
// while the photo is drawn plus a gradient wash over it; the two hard grades (duotone, comic)
// remap a cached downscaled copy of each photo pixel by pixel, so dragging a panel stays fast.

export const GRADES = [
  { id: 'none', name: 'No grade', filter: '' },
  { id: 'sunset', name: 'Sunset Vice', filter: 'saturate(1.35) contrast(1.07) brightness(1.03)' },
  { id: 'neon', name: 'Neon Night', filter: 'saturate(1.6) contrast(1.18) brightness(1.02)' },
  { id: 'duotone', name: 'Duotone', filter: '' },
  { id: 'comic', name: 'Comic B&W', filter: '' },
];

export function gradeOf(id) {
  return GRADES.find((g) => g.id === id) ?? GRADES[1];
}

export function isPixelGrade(id) {
  return id === 'duotone' || id === 'comic';
}

const DUOTONE_STOPS = [
  [0, [36, 10, 74]], // deep violet shadows
  [0.55, [205, 36, 118]], // hot pink mids
  [1, [255, 199, 92]], // amber highlights
];

function duotoneColor(lum) {
  for (let s = 1; s < DUOTONE_STOPS.length; s++) {
    const [hiAt, hi] = DUOTONE_STOPS[s];
    if (lum <= hiAt || s === DUOTONE_STOPS.length - 1) {
      const [loAt, lo] = DUOTONE_STOPS[s - 1];
      const t = Math.min(1, Math.max(0, (lum - loAt) / (hiAt - loAt || 1)));
      return [0, 1, 2].map((c) => Math.round(lo[c] + (hi[c] - lo[c]) * t));
    }
  }
  return DUOTONE_STOPS[DUOTONE_STOPS.length - 1][1];
}

const processedCache = new Map();

/**
 * The drawable to paint for a photo under a grade: the photo itself for the light grades, or a
 * pixel-remapped canvas for duotone and comic (cached per photo and grade).
 */
export function gradedPhoto(photo, gradeId) {
  if (!isPixelGrade(gradeId)) return photo.img;
  const key = `${photo.id}:${gradeId}`;
  const hit = processedCache.get(key);
  if (hit) return hit;
  const maxSide = 900;
  const scale = Math.min(1, maxSide / Math.max(photo.img.naturalWidth, photo.img.naturalHeight));
  const w = Math.max(1, Math.round(photo.img.naturalWidth * scale));
  const h = Math.max(1, Math.round(photo.img.naturalHeight * scale));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  ctx.drawImage(photo.img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h);
  const px = data.data;
  for (let i = 0; i < px.length; i += 4) {
    const lum = (0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]) / 255;
    if (gradeId === 'duotone') {
      const [r, g, b] = duotoneColor(lum);
      px[i] = r;
      px[i + 1] = g;
      px[i + 2] = b;
    } else {
      // Comic: crush the grey ramp to five hard steps with a contrast lift.
      const stepped = Math.round(Math.min(1, Math.max(0, (lum - 0.5) * 1.3 + 0.5)) * 4) / 4;
      px[i] = px[i + 1] = px[i + 2] = Math.round(stepped * 255);
    }
  }
  ctx.putImageData(data, 0, 0);
  processedCache.set(key, c);
  return c;
}

/** The gradient wash a light grade lays over a drawn photo, clipped to the rect given. */
export function drawGradeOverlay(ctx, gradeId, x, y, w, h) {
  if (gradeId === 'sunset') {
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, 'rgba(255, 176, 66, 0.10)');
    g.addColorStop(0.55, 'rgba(255, 92, 92, 0.16)');
    g.addColorStop(1, 'rgba(166, 28, 122, 0.40)');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
  } else if (gradeId === 'neon') {
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, 'rgba(0, 229, 255, 0.16)');
    g.addColorStop(0.5, 'rgba(20, 0, 60, 0.05)');
    g.addColorStop(1, 'rgba(255, 45, 150, 0.32)');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
  } else if (gradeId === 'duotone') {
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, 'rgba(255, 255, 255, 0)');
    g.addColorStop(1, 'rgba(20, 0, 40, 0.18)');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
  }
}
