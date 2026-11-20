// Fixed scenes for taking this entry's screenshots, steered entirely by
// the page's query string:
//   ?shot=cover   draws one finished cover, full frame, at the pixel size
//                 given by w and h, using layout / grade / title /
//                 subtitle / stars and the comma-separated sample names
//                 in photos, cycled across the layout's panels.
//   ?shot=editor  opens the studio with the same scene applied and the
//                 named samples loaded into the tray.
// `api` is studio.js' scene surface. When the scene is fully painted and
// the lettering fonts have arrived, window.__shotReady flips to true so
// a screenshot never catches a half-finished frame.

export async function runScene(kind, params, api) {
  const named = (params.get('photos') || 'convertible')
    .split(',')
    .map((name) => name.trim())
    .filter((name) => name.length > 0);
  const scene = {
    layout: params.get('layout') || 'showcase',
    grade: params.get('grade') || 'dusk',
    headline: params.get('title') || 'NEON PALMS',
    tagline: params.get('subtitle') || 'golden hour rules',
    stars: Number(params.get('stars') || 5),
    photos: named,
    width: Number(params.get('w') || 1280),
    height: Number(params.get('h') || 720),
  };
  if (kind === 'cover') {
    document.body.classList.add('cover-only');
    await api.paintStandaloneCover(scene);
  } else {
    await api.openStudioWithScene(scene);
  }
  await Promise.all([
    document.fonts.load('90px "Anton"'),
    document.fonts.load('40px "Pacifico"'),
    document.fonts.ready,
  ]);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.__shotReady = true;
    });
  });
}
