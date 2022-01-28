export function mockHsLayerListService() {
  return jasmine.createSpyObj('HsLayerListService', [
    'toggleSublayersVisibility',
    'filterLayers',
    'generateLayerTitlesArray',
    'changeSublayerVisibilityState',
    'isLayerQueryable',
  ]);
}
