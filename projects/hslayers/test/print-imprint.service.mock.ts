export function mockHsPrintImprintService() {
  return jasmine.createSpyObj('HsPrintImprintService', ['drawImprintCanvas']);
}
