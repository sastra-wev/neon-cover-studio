// Cover lettering, drawn on the canvas so the exported PNG carries it: a big display title in
// the vendored Anton face (app/fonts/, SIL Open Font License) and a caption line under it, with
// the heat stars in the corner. All lettering is this app's own — no borrowed wordmarks or art.

const TITLE_FONT = 'Anton, "Arial Narrow", sans-serif';

/** Splits a title into lines of at most maxWidth, at most three lines, words kept whole. */
export function wrapTitle(ctx, text, maxWidth) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > maxWidth && lines.length < 2) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

function drawStars(ctx, state, w, h) {
  if (!state.stars) return;
  const size = h * 0.05;
  ctx.save();
  ctx.font = `${size}px ${TITLE_FONT}`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = size * 0.25;
  ctx.fillStyle = '#ffd166';
  ctx.fillText('★'.repeat(state.stars), w - w * 0.035, h * 0.028);
  ctx.restore();
}

/** A soft dark fade behind the lettering so it reads over any photo. */
function drawTextBackdrop(ctx, state, w, h, blockTop, blockBottom) {
  ctx.save();
  if (state.titlePosition === 'middle') {
    ctx.fillStyle = 'rgba(10, 3, 24, 0.38)';
    ctx.fillRect(0, blockTop - h * 0.02, w, blockBottom - blockTop + h * 0.04);
  } else if (state.titlePosition === 'top') {
    const g = ctx.createLinearGradient(0, 0, 0, blockBottom + h * 0.05);
    g.addColorStop(0, 'rgba(10, 3, 24, 0.55)');
    g.addColorStop(1, 'rgba(10, 3, 24, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, blockBottom + h * 0.05);
  } else {
    const g = ctx.createLinearGradient(0, blockTop - h * 0.06, 0, h);
    g.addColorStop(0, 'rgba(10, 3, 24, 0)');
    g.addColorStop(1, 'rgba(10, 3, 24, 0.58)');
    ctx.fillStyle = g;
    ctx.fillRect(0, blockTop - h * 0.06, w, h - blockTop + h * 0.06);
  }
  ctx.restore();
}

/** Draws the title block (title, caption, stars) onto the cover at its own size. */
export function drawLettering(ctx, state, w, h) {
  drawStars(ctx, state, w, h);
  const title = state.title.trim().toUpperCase();
  const caption = state.caption.trim().toUpperCase();
  if (!title && !caption) return;

  let size = h * 0.115 * state.titleScale;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  let lines = [];
  if (title) {
    const setFont = () => { ctx.font = `${size}px ${TITLE_FONT}`; };
    setFont();
    while (size > h * 0.03) {
      lines = wrapTitle(ctx, title, w * 0.92);
      if (lines.every((l) => ctx.measureText(l).width <= w * 0.92)) break;
      size *= 0.92;
      setFont();
    }
    if (!lines.length) lines = wrapTitle(ctx, title, w * 0.92);
  }
  const captionSize = size * 0.34;
  const titleHeight = lines.length * size * 1.04;
  const captionHeight = caption ? captionSize * 1.6 : 0;
  const blockHeight = titleHeight + captionHeight;

  let blockTop;
  if (state.titlePosition === 'top') blockTop = h * 0.055;
  else if (state.titlePosition === 'middle') blockTop = (h - blockHeight) / 2;
  else blockTop = h * 0.945 - blockHeight;
  drawTextBackdrop(ctx, state, w, h, blockTop, blockTop + blockHeight);

  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = size * 0.16;
  ctx.lineJoin = 'round';
  lines.forEach((line, i) => {
    const y = blockTop + size * (i + 0.92) + i * size * 0.12;
    ctx.font = `${size}px ${TITLE_FONT}`;
    ctx.strokeStyle = 'rgba(24, 4, 36, 0.9)';
    ctx.lineWidth = size * 0.13;
    ctx.strokeText(line, w / 2, y);
    ctx.fillStyle = state.titleColor;
    ctx.fillText(line, w / 2, y);
  });
  if (caption) {
    ctx.font = `${captionSize}px ${TITLE_FONT}`;
    try { ctx.letterSpacing = `${Math.round(captionSize * 0.14)}px`; } catch { /* older engines */ }
    ctx.shadowBlur = captionSize * 0.3;
    ctx.fillStyle = state.captionColor;
    ctx.fillText(caption, w / 2, blockTop + titleHeight + captionSize * 1.35);
  }
  ctx.restore();
}
