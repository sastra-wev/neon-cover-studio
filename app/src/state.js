// Shared editor state for Neon Cover Studio: the photos the person loaded, how each one sits in
// its panel, the layout and grade in use, the lettering and the export size. Nothing here touches
// the network: photos are decoded images and object URLs held only in this tab.

export const EXPORT_SIZES = [
  { id: 'square', label: '1080 × 1080', width: 1080, height: 1080 },
  { id: 'portrait', label: '1080 × 1350', width: 1080, height: 1350 },
  { id: 'wide', label: '1920 × 1080', width: 1920, height: 1080 },
];

/** One panel's placement of its photo: offsets are fractions of the panel, zoom multiplies the fit. */
export function makePanel(photoIndex = -1) {
  return { photoIndex, offsetX: 0, offsetY: 0, zoom: 1, fit: 'fill' };
}

export function createState() {
  return {
    photos: [], // { id, name, img, url } — img is an HTMLImageElement, url its local object URL
    nextPhotoId: 1,
    layoutId: 'classic5',
    panels: [], // one makePanel() per layout slot, kept in step by syncPanels()
    selectedPanel: 0,
    spanAll: false, // one photo stretched across every panel instead of one photo per panel
    spanPhotoIndex: 0,
    spanTransform: makePanel(0), // placement used for the spanning photo
    gradeId: 'sunset',
    title: 'NEON HARBOR',
    caption: 'One night in the neon city',
    titleColor: '#ffffff',
    captionColor: '#ffd166',
    titleScale: 1,
    titlePosition: 'bottom', // 'top' | 'middle' | 'bottom'
    stars: 0, // 0–5 heat stars drawn in the top corner
    sizeId: 'square',
  };
}

export function exportSizeOf(state) {
  return EXPORT_SIZES.find((s) => s.id === state.sizeId) ?? EXPORT_SIZES[0];
}

/** Grows or trims the panel list to the layout's slot count, keeping placements already made. */
export function syncPanels(state, slotCount) {
  while (state.panels.length < slotCount) {
    const index = state.panels.length;
    state.panels.push(makePanel(state.photos.length ? index % state.photos.length : -1));
  }
  state.panels.length = slotCount;
  if (state.selectedPanel >= slotCount) state.selectedPanel = 0;
}

/**
 * Adds a decoded photo and fills the first still-empty panel with it, so dropping a handful of
 * photos builds a cover at once. Returns the photo's index in state.photos.
 */
export function addPhoto(state, img, url, name) {
  state.photos.push({ id: state.nextPhotoId++, name, img, url });
  const index = state.photos.length - 1;
  const empty = state.panels.find((p) => p.photoIndex < 0);
  if (empty) empty.photoIndex = index;
  if (state.photos.length === 1) state.spanPhotoIndex = 0;
  return index;
}

/** Removes a photo and repairs every panel index that pointed at it or past it. */
export function removePhoto(state, index) {
  const [gone] = state.photos.splice(index, 1);
  if (gone?.url?.startsWith('blob:')) URL.revokeObjectURL(gone.url);
  for (const panel of state.panels) {
    if (panel.photoIndex === index) panel.photoIndex = -1;
    else if (panel.photoIndex > index) panel.photoIndex -= 1;
  }
  if (state.spanPhotoIndex >= state.photos.length) state.spanPhotoIndex = 0;
}

/** The placement the panel editor edits: the spanning transform, or the selected panel's. */
export function activeTransform(state) {
  return state.spanAll ? state.spanTransform : state.panels[state.selectedPanel] ?? state.spanTransform;
}
