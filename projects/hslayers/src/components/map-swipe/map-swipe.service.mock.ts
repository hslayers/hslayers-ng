export function mockHsMapSwipeService() {
  return jasmine.createSpyObj('HsMapSwipeService', [
    'init',
    'addSwipeLayer',
    'layersAvailable',
    'fillSwipeLayers',
    'moveSwipeLayer',
    'addSwipeLayers',
    'setLayerActive',
    'moveRight',
    'moveLeft',
    'removeCompletely',
    'checkForMissingLayers',
    'setInitialSwipeLayers',
    'fillExplicitLayers',
    'setControl',
    'sortLayers',
    'getLayerDescriptor',
    'changeLayerVisibility',
    'getLayerVisibility',
  ]);
}
