// The Neon Palms cover renderer: paints a finished cover onto a 2D canvas
// at whatever pixel size the canvas carries. Photos sit in the layout's
// panels separated by pale gutters; a colour grade, a tinted wash, film
// grain and a vignette go over the whole frame; the lettering block — a
// heavy condensed title, a script tagline and a row of heat stars — is
// drawn last, on top of everything.
//
// The cover description it consumes:
//   layout    one of layouts.js' layouts (slots in relative units)
//   slots     per-slot placement: { img, panX, panY, zoom }, img may be
//             null; panX/panY move the photo inside its panel as a
//             fraction of the panel, zoom scales the cover-fit
//   grade     'dusk' | 'vice' | 'gold' | 'mono' | 'raw'
//   headline  the title line (Anton, forced to upper case)
//   tagline   the script line beneath it (Pacifico)
//   stars     0..5 heat stars, 0 hides the row
//   grain     boolean, film grain overlay
//   vignette  boolean, corner darkening

const GRADE_CSS = {
  dusk: 'saturate(1.4) contrast(1.05) brightness(1.03)',
  vice: 'saturate(1.6) contrast(1.1) hue-rotate(-10deg)',
  gold: 'sepia(0.32) saturate(1.2) contrast(1.05)',
  mono: 'grayscale(0.75) contrast(1.16) brightness(0.97)',
  raw: '',
};

// Vertical colour washes laid over the graded photos with 'overlay'.
const GRADE_TINT = {
  dusk: [[0, 'rgba(255,170,60,0.12)'], [0.5, 'rgba(255,90,130,0.13)'], [1, 'rgba(50,10,100,0.30)']],
  vice: [[0, 'rgba(0,230,210,0.15)'], [0.55, 'rgba(25,35,150,0.12)'], [1, 'rgba(255,45,150,0.25)']],
  gold: [[0, 'rgba(255,196,86,0.08)'], [1, 'rgba(140,58,8,0.26)']],
  mono: [[0, 'rgba(0,0,0,0.06)'], [1, 'rgba(0,0,0,0.32)']],
  raw: [],
};

let noiseTile = null;

// Builds (once) a small grayscale noise canvas used as the grain pattern.
function grainTile(g) {
  const tile = document.createElement('canvas');
  tile.width = 220;
  tile.height = 220;
  const tg = tile.getContext('2d');
  const pixels = tg.createImageData(220, 220);
  for (let i = 0; i < pixels.data.length; i += 4) {
    const shade = 110 + Math.floor(Math.random() * 100);
    pixels.data[i] = shade;
    pixels.data[i + 1] = shade;
    pixels.data[i + 2] = shade;
    pixels.data[i + 3] = 255;
  }
  tg.putImageData(pixels, 0, 0);
  noiseTile = g.createPattern(tile, 'repeat');
  return noiseTile;
}

// Paints one slot's photo into its rectangle, cover-fitted and panned.
function paintSlot(g, rect, slot, cssFilter) {
  g.save();
  g.beginPath();
  g.rect(rect.x, rect.y, rect.w, rect.h);
  g.clip();
  if (!slot || !slot.img) {
    const blank = g.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
    blank.addColorStop(0, '#41245f');
    blank.addColorStop(1, '#140826');
    g.fillStyle = blank;
    g.fillRect(rect.x, rect.y, rect.w, rect.h);
    g.restore();
    return;
  }
  const img = slot.img;
  const fit = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight) * (slot.zoom || 1);
  const drawnW = img.naturalWidth * fit;
  const drawnH = img.naturalHeight * fit;
  const originX = rect.x + (rect.w - drawnW) / 2 + (slot.panX || 0) * rect.w;
  const originY = rect.y + (rect.h - drawnH) / 2 + (slot.panY || 0) * rect.h;
  if (cssFilter) g.filter = cssFilter;
  g.drawImage(img, originX, originY, drawnW, drawnH);
  g.filter = 'none';
  g.restore();
}

// The warm sunset ramp the headline letters are filled with.
function headlineFill(g, top, height) {
  const ramp = g.createLinearGradient(0, top, 0, top + height);
  ramp.addColorStop(0, '#ffe45e');
  ramp.addColorStop(0.4, '#ffb347');
  ramp.addColorStop(0.72, '#ff4f81');
  ramp.addColorStop(1, '#a24bff');
  return ramp;
}

// Shrinks a font size from `start` until `text` fits `maxWidth`.
function shrinkToFit(g, text, family, start, maxWidth) {
  let size = start;
  g.font = `${size}px ${family}`;
  while (size > 12 && g.measureText(text).width > maxWidth) {
    size -= 3;
    g.font = `${size}px ${family}`;
  }
  return size;
}

// One five-pointed star path centred on (cx, cy) with outer radius r.
function starPath(g, cx, cy, r) {
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? r : r * 0.45;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
  }
  g.closePath();
}

// The lettering: headline, tagline and heat stars, top-centred.
function paintLettering(g, w, h, cover) {
  const headline = (cover.headline || '').trim().toUpperCase();
  const tagline = (cover.tagline || '').trim();
  if (!headline && !tagline) return;
  const centre = w / 2;
  g.textAlign = 'center';
  g.textBaseline = 'alphabetic';
  let baseline = h * 0.05;
  let headlineSize = 0;
  if (headline) {
    headlineSize = shrinkToFit(g, headline, '"Anton", sans-serif', h * 0.13, w * 0.9);
    baseline += headlineSize;
    g.font = `${headlineSize}px "Anton", sans-serif`;
    g.lineJoin = 'round';
    g.lineWidth = headlineSize * 0.17;
    g.strokeStyle = 'rgba(26,5,40,0.92)';
    g.shadowColor = 'rgba(0,0,0,0.5)';
    g.shadowBlur = headlineSize * 0.16;
    g.shadowOffsetY = headlineSize * 0.05;
    g.strokeText(headline, centre, baseline);
    g.shadowBlur = 0;
    g.shadowOffsetY = 0;
    g.fillStyle = headlineFill(g, baseline - headlineSize, headlineSize * 1.05);
    g.fillText(headline, centre, baseline);
  }
  if (tagline) {
    const tagSize = shrinkToFit(g, tagline, '"Pacifico", cursive', headlineSize ? headlineSize * 0.4 : h * 0.048, w * 0.66);
    g.font = `${tagSize}px "Pacifico", cursive`;
    g.save();
    g.translate(centre + w * 0.09, baseline + tagSize * 0.8);
    g.rotate(-0.05);
    g.lineJoin = 'round';
    g.lineWidth = tagSize * 0.24;
    g.strokeStyle = 'rgba(26,5,40,0.9)';
    g.strokeText(tagline, 0, 0);
    g.fillStyle = '#6ff5e2';
    g.fillText(tagline, 0, 0);
    g.restore();
    baseline += tagSize * 0.9;
  }
  const wanted = Math.max(0, Math.min(5, cover.stars || 0));
  if (wanted > 0) {
    const r = h * 0.016;
    const spacing = r * 2.7;
    const rowY = baseline + r * 2.1;
    g.fillStyle = '#ffd94a';
    g.shadowColor = 'rgba(0,0,0,0.55)';
    g.shadowBlur = r * 0.5;
    for (let i = 0; i < wanted; i++) {
      starPath(g, centre + (i - (wanted - 1) / 2) * spacing, rowY, r);
      g.fill();
    }
    g.shadowBlur = 0;
  }
}

// Renders the whole cover described by `cover` onto `canvas`.
export function renderCover(canvas, cover) {
  const g = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const gutter = Math.max(5, Math.round(w * 0.008));
  g.fillStyle = '#f7f2e7';
  g.fillRect(0, 0, w, h);
  const cssFilter = GRADE_CSS[cover.grade] ?? '';
  cover.layout.slots.forEach((slotRect, index) => {
    paintSlot(g, {
      x: slotRect.left * w + gutter / 2,
      y: slotRect.top * h + gutter / 2,
      w: slotRect.width * w - gutter,
      h: slotRect.height * h - gutter,
    }, cover.slots[index], cssFilter);
  });
  const tint = GRADE_TINT[cover.grade] ?? [];
  if (tint.length > 0) {
    const wash = g.createLinearGradient(0, 0, 0, h);
    for (const [at, colour] of tint) wash.addColorStop(at, colour);
    g.save();
    g.globalCompositeOperation = 'overlay';
    g.fillStyle = wash;
    g.fillRect(0, 0, w, h);
    g.restore();
  }
  if (cover.grain) {
    g.save();
    g.globalAlpha = 0.08;
    g.globalCompositeOperation = 'overlay';
    g.fillStyle = noiseTile || grainTile(g);
    g.fillRect(0, 0, w, h);
    g.restore();
  }
  if (cover.vignette) {
    const glow = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.4, w / 2, h / 2, Math.max(w, h) * 0.75);
    glow.addColorStop(0, 'rgba(10,0,20,0)');
    glow.addColorStop(1, 'rgba(10,0,20,0.4)');
    g.fillStyle = glow;
    g.fillRect(0, 0, w, h);
  }
  paintLettering(g, w, h, cover);
}

// Index of the layout slot under point (px, py) on a w × h cover, or -1.
export function slotIndexAt(layout, w, h, px, py) {
  for (let i = layout.slots.length - 1; i >= 0; i--) {
    const s = layout.slots[i];
    if (px >= s.left * w && px <= (s.left + s.width) * w && py >= s.top * h && py <= (s.top + s.height) * h) return i;
  }
  return -1;
}
