export function mockHsLayerShiftingService() {
  return jasmine.createSpyObj('HsLayerShiftingService', [
    'fillLayers',
    'moveTo',
    'getMaxZ',
    'getMinZ',
    'moveToBottom',
    'moveToTop',
    'swapSibling',
    'get',
  ]);
}
