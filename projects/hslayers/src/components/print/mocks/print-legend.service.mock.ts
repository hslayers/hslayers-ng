export function mockHsPrintLegendService() {
  return jasmine.createSpyObj('HsPrintLegendService', [
    'svgToImage',
    'drawLegendCanvas',
  ]);
}
