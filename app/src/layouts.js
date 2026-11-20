// Panel geometry for Neon Palms covers.
//
// Every layout is a list of rectangles in cover-relative units (0..1 on
// both axes), so one layout renders identically at any export size.
// The opening rectangle is the hero slot: the studio fills it first and
// the shot scenes lead with the strongest photo there.

export const COVER_LAYOUTS = [
  {
    id: 'showcase',
    label: 'Showcase — hero with a side stack',
    slots: [
      { left: 0, top: 0, width: 0.58, height: 1 },
      { left: 0.58, top: 0, width: 0.42, height: 0.36 },
      { left: 0.58, top: 0.36, width: 0.42, height: 0.32 },
      { left: 0.58, top: 0.68, width: 0.42, height: 0.32 },
    ],
  },
  {
    id: 'mosaic',
    label: 'Mosaic — nine equal panels',
    slots: [
      { left: 0, top: 0, width: 1 / 3, height: 1 / 3 },
      { left: 1 / 3, top: 0, width: 1 / 3, height: 1 / 3 },
      { left: 2 / 3, top: 0, width: 1 / 3, height: 1 / 3 },
      { left: 0, top: 1 / 3, width: 1 / 3, height: 1 / 3 },
      { left: 1 / 3, top: 1 / 3, width: 1 / 3, height: 1 / 3 },
      { left: 2 / 3, top: 1 / 3, width: 1 / 3, height: 1 / 3 },
      { left: 0, top: 2 / 3, width: 1 / 3, height: 1 / 3 },
      { left: 1 / 3, top: 2 / 3, width: 1 / 3, height: 1 / 3 },
      { left: 2 / 3, top: 2 / 3, width: 1 / 3, height: 1 / 3 },
    ],
  },
  {
    id: 'quarters',
    label: 'Quarters — four panels',
    slots: [
      { left: 0, top: 0, width: 0.5, height: 0.5 },
      { left: 0.5, top: 0, width: 0.5, height: 0.5 },
      { left: 0, top: 0.5, width: 0.5, height: 0.5 },
      { left: 0.5, top: 0.5, width: 0.5, height: 0.5 },
    ],
  },
  {
    id: 'columns',
    label: 'Columns — three verticals',
    slots: [
      { left: 0, top: 0, width: 0.4, height: 1 },
      { left: 0.4, top: 0, width: 0.3, height: 1 },
      { left: 0.7, top: 0, width: 0.3, height: 1 },
    ],
  },
  {
    id: 'billboard',
    label: 'Billboard — one photo, full frame',
    slots: [{ left: 0, top: 0, width: 1, height: 1 }],
  },
];

// Looks up a layout by id, falling back to the showcase.
export function findLayout(id) {
  return COVER_LAYOUTS.find((entry) => entry.id === id) || COVER_LAYOUTS[0];
}

// The sizes a finished cover can be exported at: [width, height, label].
export const EXPORT_SIZES = [
  [1080, 1080, 'Square — 1080 × 1080'],
  [1080, 1350, 'Portrait — 1080 × 1350'],
  [1920, 1080, 'Wide — 1920 × 1080'],
];
