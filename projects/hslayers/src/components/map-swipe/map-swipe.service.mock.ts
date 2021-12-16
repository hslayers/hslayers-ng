export function mockHsMapSwipeService() {
  return jasmine.createSpyObj('HsMapSwipeService', [
    'init',
    'layersAvailable',
    'fillSwipeLayers',
    'addSwipeLayer',
    'addSwipeLayers',
    'setLayerActive',
    'addRight',
    'addLeft',
    'removeCompletely',
    'checkForMissingLayers',
    'setInitialSwipeLayers',
    'fillExplicitLayers',
  ]);
}
