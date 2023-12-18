export function mockHsPrintService() {
  return jasmine.createSpyObj('HsPrintService', [
    'print',
    'download',
    'createMapImage',
  ]);
}
