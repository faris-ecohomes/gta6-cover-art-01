// Neon Palms studio: the editor wiring around render.js' cover painter.
//
// A cover in progress is one `state` object. Its `slots` array mirrors the
// chosen layout slot for slot; every slot holds an image (or null) plus a
// pan and zoom the reader adjusts by dragging on the canvas and scrolling.
// The preview canvas always carries the export size's pixels, so what is
// on screen is exactly what the Export button writes to the PNG.

import { COVER_LAYOUTS, EXPORT_SIZES, findLayout } from './layouts.js';
import { renderCover, slotIndexAt } from './render.js';
import { runScene } from './scenes.js';

const SAMPLE_PHOTOS = [
  { name: 'convertible', src: './samples/convertible.jpg', label: 'Convertible at golden hour' },
  { name: 'neon', src: './samples/neon.jpg', label: 'Neon street after rain' },
  { name: 'pier', src: './samples/pier.jpg', label: 'Pier at dusk' },
  { name: 'rooftop', src: './samples/rooftop.jpg', label: 'Rooftop over the bay' },
];

const canvas = document.getElementById('stage');
const status = document.getElementById('status');
const trayEl = document.getElementById('tray');

const state = {
  layout: findLayout('showcase'),
  grade: 'dusk',
  headline: 'NEON PALMS',
  tagline: 'golden hour rules',
  stars: 5,
  grain: true,
  vignette: true,
  size: EXPORT_SIZES[0],
  slots: [],
  selected: 0,
};

const tray = []; // { img, label } — every photo the reader has at hand

function say(message) {
  status.textContent = message;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function blankSlot(img) {
  return { img: img || null, panX: 0, panY: 0, zoom: 1 };
}

// Rebuilds the slot list for a layout, carrying photos across in order.
function adoptLayout(layout) {
  const carried = state.slots.map((slot) => slot.img).filter(Boolean);
  state.layout = layout;
  state.slots = layout.slots.map((_, i) => blankSlot(carried[i % Math.max(1, carried.length)] || null));
  if (carried.length === 0) state.slots = layout.slots.map(() => blankSlot(null));
  state.selected = 0;
}

function draw() {
  canvas.width = state.size[0];
  canvas.height = state.size[1];
  renderCover(canvas, state);
}

// --- tray ---------------------------------------------------------------

function refreshTray() {
  trayEl.replaceChildren();
  tray.forEach((entry, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'thumb';
    button.title = entry.label;
    const thumb = document.createElement('img');
    thumb.src = entry.img.src;
    thumb.alt = entry.label;
    button.appendChild(thumb);
    button.addEventListener('click', () => {
      state.slots[state.selected] = blankSlot(entry.img);
      draw();
      say(`Placed "${entry.label}" in panel ${state.selected + 1}.`);
    });
    trayEl.appendChild(button);
  });
}

async function addSample(sample) {
  if (tray.some((entry) => entry.label === sample.label)) return;
  const img = await loadImage(sample.src);
  tray.push({ img, label: sample.label });
  refreshTray();
}

// Drops the tray's photos into the panels in order, hero first.
function autoFill() {
  if (tray.length === 0) return;
  state.slots = state.layout.slots.map((_, i) => blankSlot(tray[i % tray.length].img));
  draw();
}

// --- canvas interaction ---------------------------------------------------

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height,
  };
}

let drag = null;

canvas.addEventListener('pointerdown', (event) => {
  const point = canvasPoint(event);
  const hit = slotIndexAt(state.layout, canvas.width, canvas.height, point.x, point.y);
  if (hit === -1) return;
  state.selected = hit;
  drag = { x: event.clientX, y: event.clientY };
  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener('pointermove', (event) => {
  if (!drag) return;
  const slot = state.slots[state.selected];
  if (!slot || !slot.img) return;
  const rect = canvas.getBoundingClientRect();
  slot.panX = clamp(slot.panX + ((event.clientX - drag.x) / rect.width) * 1.4, -0.5, 0.5);
  slot.panY = clamp(slot.panY + ((event.clientY - drag.y) / rect.height) * 1.4, -0.5, 0.5);
  drag = { x: event.clientX, y: event.clientY };
  draw();
});

canvas.addEventListener('pointerup', () => {
  drag = null;
});

canvas.addEventListener('wheel', (event) => {
  const slot = state.slots[state.selected];
  if (!slot || !slot.img) return;
  event.preventDefault();
  slot.zoom = clamp(slot.zoom * (event.deltaY < 0 ? 1.07 : 0.93), 1, 3.2);
  draw();
}, { passive: false });

function clamp(value, lo, hi) {
  return Math.min(hi, Math.max(lo, value));
}

// --- controls ---------------------------------------------------------------

function bindControls() {
  const layoutSel = document.getElementById('layoutSel');
  for (const layout of COVER_LAYOUTS) {
    const option = document.createElement('option');
    option.value = layout.id;
    option.textContent = layout.label;
    layoutSel.appendChild(option);
  }
  layoutSel.value = state.layout.id;
  layoutSel.addEventListener('change', () => {
    adoptLayout(findLayout(layoutSel.value));
    draw();
  });

  const sizeSel = document.getElementById('sizeSel');
  EXPORT_SIZES.forEach((size, index) => {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = size[2];
    sizeSel.appendChild(option);
  });
  sizeSel.addEventListener('change', () => {
    state.size = EXPORT_SIZES[Number(sizeSel.value)];
    draw();
  });

  const gradeSel = document.getElementById('gradeSel');
  gradeSel.value = state.grade;
  gradeSel.addEventListener('change', () => {
    state.grade = gradeSel.value;
    draw();
  });

  const titleIn = document.getElementById('titleIn');
  titleIn.value = state.headline;
  titleIn.addEventListener('input', () => {
    state.headline = titleIn.value;
    draw();
  });

  const subtitleIn = document.getElementById('subtitleIn');
  subtitleIn.value = state.tagline;
  subtitleIn.addEventListener('input', () => {
    state.tagline = subtitleIn.value;
    draw();
  });

  const starsIn = document.getElementById('starsIn');
  starsIn.value = String(state.stars);
  starsIn.addEventListener('input', () => {
    state.stars = Number(starsIn.value);
    draw();
  });

  const grainChk = document.getElementById('grainChk');
  grainChk.checked = state.grain;
  grainChk.addEventListener('change', () => {
    state.grain = grainChk.checked;
    draw();
  });

  const vigChk = document.getElementById('vigChk');
  vigChk.checked = state.vignette;
  vigChk.addEventListener('change', () => {
    state.vignette = vigChk.checked;
    draw();
  });

  const sampleRow = document.getElementById('sampleRow');
  for (const sample of SAMPLE_PHOTOS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = sample.name;
    button.addEventListener('click', async () => {
      await addSample(sample);
      say(`Sample "${sample.name}" is in the tray.`);
    });
    sampleRow.appendChild(button);
  }

  document.getElementById('photoFiles').addEventListener('change', async (event) => {
    const files = Array.from(event.target.files || []);
    for (const file of files) {
      const img = await loadImage(URL.createObjectURL(file));
      tray.push({ img, label: file.name });
    }
    refreshTray();
    if (files.length > 0) say(`${files.length} photo(s) added to the tray.`);
  });

  document.getElementById('autoBtn').addEventListener('click', () => {
    autoFill();
    say('Panels filled from the tray.');
  });

  document.getElementById('oneBtn').addEventListener('click', () => {
    const current = state.slots[state.selected];
    if (!current || !current.img) {
      say('Pick a panel with a photo first.');
      return;
    }
    state.slots = state.layout.slots.map(() => blankSlot(current.img));
    draw();
    say('One photo across every panel.');
  });

  document.getElementById('exportBtn').addEventListener('click', () => {
    canvas.toBlob((blob) => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'neon-palms-cover.png';
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 4000);
      say(`Exported a ${state.size[0]} × ${state.size[1]} PNG.`);
    }, 'image/png');
  });
}

// --- scene surface used by scenes.js ---------------------------------------

async function loadNamedSamples(names) {
  const images = [];
  for (const name of names) {
    const sample = SAMPLE_PHOTOS.find((entry) => entry.name === name) || SAMPLE_PHOTOS[0];
    images.push(await loadImage(sample.src));
  }
  return images;
}

function applySceneSettings(scene) {
  state.layout = findLayout(scene.layout);
  state.grade = scene.grade;
  state.headline = scene.headline;
  state.tagline = scene.tagline;
  state.stars = scene.stars;
}

const sceneApi = {
  // Draws a single finished cover at the scene's pixel size, no chrome.
  async paintStandaloneCover(scene) {
    applySceneSettings(scene);
    const images = await loadNamedSamples(scene.photos);
    state.slots = state.layout.slots.map((_, i) => blankSlot(images[i % images.length]));
    canvas.width = scene.width;
    canvas.height = scene.height;
    renderCover(canvas, state);
  },

  // Boots the editor, then applies the scene and fills the panels.
  async openStudioWithScene(scene) {
    bindControls();
    applySceneSettings(scene);
    document.getElementById('layoutSel').value = state.layout.id;
    document.getElementById('gradeSel').value = state.grade;
    document.getElementById('titleIn').value = state.headline;
    document.getElementById('subtitleIn').value = state.tagline;
    document.getElementById('starsIn').value = String(state.stars);
    for (const sample of SAMPLE_PHOTOS) await addSample(sample);
    const images = await loadNamedSamples(scene.photos);
    state.slots = state.layout.slots.map((_, i) => blankSlot(images[i % images.length]));
    draw();
  },
};

// --- boot ---------------------------------------------------------------------

async function boot() {
  const params = new URLSearchParams(location.search);
  const shot = params.get('shot');
  if (shot) {
    await runScene(shot, params, sceneApi);
    return;
  }
  bindControls();
  adoptLayout(state.layout);
  for (const sample of SAMPLE_PHOTOS) await addSample(sample);
  autoFill();
  say('Samples are loaded — swap in your own photos any time.');
}

boot();
