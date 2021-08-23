/**
 * List of GET parameters set and red by Hslayers
 */
export const HS_PRMS = {
  x: 'hs-x',
  y: 'hs-y',
  zoom: 'hs-z',
  visibleLayers: 'hs-visible-layers',
  panel: 'hs-panel',
  lang: 'hs-lang',
  pureMap: 'hs-puremap',
  view: 'hs-view',
  permalink: 'hs-permalink',
  composition: 'hs-composition',
  search: 'hs-search',
  layerSelected: 'hs-layer-selected',
};

/**
 * If we cant find GET param from HS_PRMS, search in old parameters list before renaming.
 * NOTE: It's important that values in HS_PRMS_BACKWARDS don't exist in
 * HS_PRMS values otherwise recursion will occur.
 */
export const HS_PRMS_BACKWARDS = {
  permalink: 'permalink',
  view: 'view',
  panel: 'hs_panel',
  lang: 'lang',
  x: 'hs_x',
  y: 'hs_y',
  zoom: 'hs_z',
  pureMap: 'puremap',
  visibleLayers: 'visible_layers',
  composition: 'composition',
  search: 'search',
  layerSelected: 'layerSelected',
};

/**
 * Some params are set on map interaction or UI and we don't
 * want to reset their values with the original ones when generating the browser URL.
 * GET params not in HS_PRMS_REGENERATED will be remembered and set in the URL.
 */
export const HS_PRMS_REGENERATED = [
  HS_PRMS.x,
  HS_PRMS.y,
  HS_PRMS.zoom,
  HS_PRMS.lang,
  HS_PRMS.panel,
  HS_PRMS.visibleLayers,

  HS_PRMS_BACKWARDS.x,
  HS_PRMS_BACKWARDS.y,
  HS_PRMS_BACKWARDS.zoom,
  HS_PRMS_BACKWARDS.lang,
  HS_PRMS_BACKWARDS.panel,
  HS_PRMS_BACKWARDS.visibleLayers,
];
