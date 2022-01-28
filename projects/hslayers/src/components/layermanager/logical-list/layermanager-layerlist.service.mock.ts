export function mockHsLayerListService() {
  return jasmine.createSpyObj('HsLayerListService', [
    'toggleSublayersVisibility',
    'filterLayers',
    'changeSublayerVisibilityState',
    'isLayerQueryable',
  ]);
}
