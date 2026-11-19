// Neon Cover Studio entry point: builds the UI, loads the bundled sample photos so the panels start
// filled, and — when a ?shot= query is present — sets up a fixed screenshot scene instead.

import { initUI, loadSamples, render } from './ui.js';
import { runShot } from './shots.js';

initUI();

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  runShot(shot, query);
} else {
  try { await document.fonts.load('80px Anton'); } catch { /* fall back to sans */ }
  render();
  loadSamples();
}
