export function mockHsPrintTitleService() {
  return jasmine.createSpyObj('HsPrintTitleService', ['drawTitleCanvas']);
}
