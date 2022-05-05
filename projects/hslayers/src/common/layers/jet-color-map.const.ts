import * as colormap from 'colormap';
export const JET_COLOR_MAP = colormap({
  colormap: 'jet',
  nshades: 100,
  format: 'rgb',
  alpha: 255,
}).map((v) => {
  v[3] = 255;
  return v;
});
