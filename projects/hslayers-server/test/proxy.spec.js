import { expect } from 'chai';

import * as proxyModule from '../src/proxy.js';

describe('Proxy module', function () {
  describe('#splitUrlAtTld()', function () {
    it('should split to three parts on localhost', function () {
      const url = ''
      expect()
    });

    it('should split to three parts on IP', function () {
      const url = ''
      expect()
    });

    it('should split to three parts on public domain 1', function () {
      const url = 'https://hub4everybody.com/proxy/https://ags.plzen.eu/arcgis/rest/services/GIS_Historicke/GIS_HIS_Plzen_1895/MapServer?f=json'
      expect()
    });
    it('should split to three parts on public domain 2', function () { //FIXME:
      const url = 'https://watlas.lesprojekt.cz/en/proxy/arcgis2/services/dmr4g/ImageServer/WMSServer/?REQUEST=GetMap&SERVICE=WMS&VERSION=1.3.0&FORMAT=image/png&STYLES=default&TRANSPARENT=true&LAYERS=dmr4g:GrayscaleHillshade&WIDTH=256&HEIGHT=256&CRS=EPSG:3857&BBOX=1878516.4071364924,6574807.42497772,2191602.474992574,6887893.492833802'
      expect()
    });
    it('should split to three parts on public domain 3', function () { //FIXME:
      const url = 'https://hub4everybody.com/proxy/arcgis2/services/dmr4g/ImageServer/WMSServer?REQUEST=GetMap&SERVICE=WMS&VERSION=1.3.0&FORMAT=image/png&STYLES=default&TRANSPARENT=true&LAYERS=dmr4g:GrayscaleHillshade&WIDTH=256&HEIGHT=256&CRS=EPSG:3857&BBOX=1878516.4071364924,6574807.42497772,2191602.474992574,6887893.492833802'
      expect()
    });
    // Add more test cases as needed
  });
});
