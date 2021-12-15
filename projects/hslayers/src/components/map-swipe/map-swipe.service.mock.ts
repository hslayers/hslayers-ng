export function mockHsMapSwipeService() {
  return jasmine.createSpyObj('HsMapSwipeService', [
    'init',
    'layersAvailable',
    'fillSwipeLayers',
    'addSwipeLayer',
    'setLayerActive',
    'addRight',
    'addLeft',
    'removeCompletely',
    'checkForMissingLayers',
    'setInitialSwipeLayers',
  ]);
}
