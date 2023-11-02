import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'epsg',
})
export class EpsgPipe implements PipeTransform {
  epsgDict = new Map([
    ['EPSG:3857', 'WGS 84 / Pseudo-Mercator'],
    ['EPSG:4326', 'WGS 84 / World Geodetic System 1984'],
    ['EPSG:5514', 'S-JTSK / Krovak East North -- SJTSK'],
    ['EPSG:32633', 'WGS 84 / UTM zone 33N'],
    ['EPSG:32634', 'WGS 84 / UTM zone 34N'],
    ['EPSG:3034', 'ETRS89 / LCC Europe'],
    ['EPSG:3035', 'ETRS89-extended / LAEA Europe'],
    ['EPSG:3059', 'ETRS89 / UTM zone 59N'],
    ['EPSG:4258', 'ETRS89'],
  ]);
  constructor() {}

  transform(epsg: string): string {
    epsg = epsg.includes('EPSG') ? epsg : `EPSG:${epsg}`;
    return this.epsgDict.has(epsg)
      ? `${epsg} - ${this.epsgDict.get(epsg)}`
      : epsg;
  }
}
