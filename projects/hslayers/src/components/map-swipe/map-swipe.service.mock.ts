export function mockHsMapSwipeService() {
  return jasmine.createSpyObj('HsMapSwipeService', [
    'init',
    'layersAvailable',
    'fillSwipeLayers',
    'addSwipeLayers',
    'setLayerActive',
    'addRight',
    'addLeft',
    'removeCompletely',
    'checkForMissingLayers',
    'setSwipeLayers',
  ]);
}
