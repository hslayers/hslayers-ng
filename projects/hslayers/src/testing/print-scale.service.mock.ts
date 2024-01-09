export function mockHsPrintScaleService() {
  return jasmine.createSpyObj('HsPrintScaleService', [
    'setToDefaultScale',
    'scaleChanged',
    'drawScaleCanvas',
    'init',
    'get',
  ]);
}
