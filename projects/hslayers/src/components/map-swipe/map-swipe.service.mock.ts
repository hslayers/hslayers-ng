export function mockHsMapSwipeService() {
  return jasmine.createSpyObj('HsMapSwipeService', [
    'init',
    'layersAvailable',
    'setOrientation',
    'fillSwipeLayers',
    'addSwipeLayer',
    'moveSwipeLayer',
    'moveRight',
    'moveLeft',
    'setControl',
    'removeCompletely',
    'setLayerActive',
    'setInitialSwipeLayers',
    'checkForMissingLayers',
    'sortLayers',
    'changeLayerVisibility',
    'layerVisibilityChanged',
    'findLayer',
  ]);
}
