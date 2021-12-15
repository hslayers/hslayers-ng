export function mockHsMapSwipeService() {
  return jasmine.createSpyObj('HsMapSwipeService', [
    'init',
    'layersAvailable',
    'fillSwipeLayers',
    'addSwipeLayers',
    'setLayerActive',
    'checkForMissingLayers',
  ]);
}
