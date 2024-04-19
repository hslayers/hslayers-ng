/**
 * List of GET parameters set and read by Hslayers
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
  hsWmsToConnect: 'hs-wms-to-connect',
  hsWfsToConnect: 'hs-wfs-to-connect',
  hsWmtsToConnect: 'hs-wmts-to-connect',
  hsKmlToConnect: 'hs-kml-to-connect',
  hsGeojsonToConnect: 'hs-geojson-to-connect',
  hsArcgisToConnect: 'hs-arcgis-to-connect',
  hsWmsLayers: 'hs-wms-layers',
  hsWfsLayers: 'hs-wfs-layers',
  hsWmtsLayers: 'hs-wmts-layers',
  hsKmlLayers: 'hs-kml-layers',
  hsGeojsonLayers: 'hs-geojson-layers',
  hsArcgisLayers: 'hs-arcgis-layers',
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
  hsWmsToConnect: 'wms_to_connect',
  hsWfsToConnect: 'wfs_to_connect',
  hsWmtsToConnect: 'wmts_to_connect',
  hsWmsLayers: 'wms_layers',
  hsWfsLayers: 'wfs_layers',
  hsWmtsLayers: 'wmts_layers',
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
