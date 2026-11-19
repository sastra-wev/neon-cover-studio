// Cover lettering: the big display title (vendored Anton, OFL) with the caption under it. The block is
// anchored top, middle or bottom, shrinks to fit, wraps the title over at most two lines, and draws a
// soft shadow plus a dark scrim so words stay readable over any photo.

function fitLines(ctx, words, maxWidth, startSize, minSize) {
  let size = startSize;
  const linesFor = (s) => {
    ctx.font = `${s}px Anton, sans-serif`;
    const lines = [];
    let line = '';
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width > maxWidth && line) { lines.push(line); line = word; }
      else line = next;
    }
    if (line) lines.push(line);
    return lines;
  };
  let lines = linesFor(size);
  while (size > minSize && (lines.length > 2 || lines.some((l) => ctx.measureText(l).width > maxWidth))) {
    size -= 4;
    lines = linesFor(size);
  }
  return { lines: lines.slice(0, 2), size };
}

export function drawText(ctx, W, H, st) {
  const title = st.title.trim().toUpperCase();
  const caption = st.caption.trim();
  if (!title && !caption) return;
  const cx = W / 2;
  const maxW = W * 0.9;
  let titleSize = 0, titleLines = [], captionSize = 0;
  if (title) {
    const fit = fitLines(ctx, title.split(/\s+/), maxW, H * 0.135 * st.textSize, 18);
    titleLines = fit.lines; titleSize = fit.size;
  }
  if (caption) {
    captionSize = Math.max(15, H * 0.034 * st.textSize);
    ctx.font = `${captionSize}px Anton, sans-serif`;
    while (ctx.measureText(caption.toUpperCase()).width > maxW && captionSize > 12) {
      captionSize -= 2; ctx.font = `${captionSize}px Anton, sans-serif`;
    }
  }
  const gap = caption ? captionSize * 0.7 : 0;
  const blockH = titleLines.length * titleSize * 1.04 + (caption ? gap + captionSize : 0);
  const margin = H * 0.055;
  let top;
  if (st.textPos === 'top') top = margin;
  else if (st.textPos === 'middle') top = (H - blockH) / 2;
  else top = H - margin - blockH;

  // Scrim behind the words, fading away from the block.
  const pad = H * 0.03;
  const grad = ctx.createLinearGradient(0, top - pad, 0, top + blockH + pad);
  const edge = st.textPos === 'top' ? 0 : 1;
  grad.addColorStop(edge, 'rgba(5,0,16,0)');
  grad.addColorStop(1 - edge, 'rgba(5,0,16,0.55)');
  if (st.textPos === 'middle') { grad.addColorStop(0, 'rgba(5,0,16,0.45)'); grad.addColorStop(1, 'rgba(5,0,16,0.45)'); }
  ctx.fillStyle = grad;
  ctx.fillRect(0, Math.max(0, top - pad), W, blockH + pad * 2);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.shadowColor = 'rgba(0,0,0,0.65)';
  let y = top;
  if (title) {
    ctx.font = `${titleSize}px Anton, sans-serif`;
    ctx.shadowBlur = titleSize * 0.16;
    ctx.lineWidth = titleSize * 0.1;
    ctx.strokeStyle = 'rgba(10,0,24,0.85)';
    for (const line of titleLines) {
      ctx.strokeText(line, cx, y);
      ctx.fillStyle = st.textColor;
      ctx.fillText(line, cx, y);
      y += titleSize * 1.04;
    }
  }
  if (caption) {
    y += gap;
    ctx.font = `${captionSize}px Anton, sans-serif`;
    ctx.shadowBlur = captionSize * 0.3;
    ctx.fillStyle = st.textColor;
    ctx.fillText(caption.toUpperCase(), cx, y);
  }
  ctx.shadowBlur = 0;
}
