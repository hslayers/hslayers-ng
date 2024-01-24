import { expect } from 'chai';

import { splitUrlAtTld, encodeUrlPathAndParams } from '../src/proxy.js';

describe('Proxy module', function() {
  describe('#splitUrlAtTld()', function() {

    //The URL is supposed to be always relative to the proxy base (i.e. only the queried URL)

    it('should split to three parts with ČÚZK service', function() {
      const url = '/https://ags.cuzk.cz/arcgis2/services/dmr4g/ImageServer/WMSServer?REQUEST=GetMap&SERVICE=WMS&VERSION=1.3.0&FORMAT=image/png&STYLES=default&TRANSPARENT=true&LAYERS=dmr4g:GrayscaleHillshade&WIDTH=256&HEIGHT=256&CRS=EPSG:3857&BBOX=1878516.4071364924,6574807.42497772,2191602.474992574,6887893.492833802'
      const split = splitUrlAtTld(url);
      expect(split).to.be.an.instanceOf(Array);
      expect(split).to.have.length(3);
      expect(split[0]).to.equal('/https://ags.cuzk');
      expect(split[1]).to.equal('cz');
      expect(split[2]).to.equal('arcgis2/services/dmr4g/ImageServer/WMSServer?REQUEST=GetMap&SERVICE=WMS&VERSION=1.3.0&FORMAT=image/png&STYLES=default&TRANSPARENT=true&LAYERS=dmr4g:GrayscaleHillshade&WIDTH=256&HEIGHT=256&CRS=EPSG:3857&BBOX=1878516.4071364924,6574807.42497772,2191602.474992574,6887893.492833802');
    });

    it('should split to three parts with ags.plzen.eu service containing diacritics', function() {
      const url = '/https://ags.plzen.eu/arcgis/rest/services/GIS_Historicke/GIS_HIS_Plzeň_1926/MapServer?f=json'
      const split = splitUrlAtTld(url);
      expect(split).to.be.an.instanceOf(Array);
      expect(split).to.have.length(3);
      expect(split[0]).to.equal('/https://ags.plzen');
      expect(split[1]).to.equal('eu');
      expect(split[2]).to.equal('arcgis/rest/services/GIS_Historicke/GIS_HIS_Plzeň_1926/MapServer?f=json');
    });

    // Add more test cases as needed
  });

  describe('#encodeUrlPathAndParams()', function() {
    it('should encode slashes, commas and colons in the search params', function() {
      const url = '/https://ags.cuzk.cz/arcgis2/services/dmr4g/ImageServer/WMSServer?REQUEST=GetMap&SERVICE=WMS&VERSION=1.3.0&FORMAT=image/png&STYLES=default&TRANSPARENT=true&LAYERS=dmr4g:GrayscaleHillshade&WIDTH=256&HEIGHT=256&CRS=EPSG:3857&BBOX=1878516.4071364924,6574807.42497772,2191602.474992574,6887893.492833802';
      const safeUrl = encodeUrlPathAndParams(url);
      expect(safeUrl).to.exist;
      expect(safeUrl).to.equal('/https://ags.cuzk.cz/arcgis2/services/dmr4g/ImageServer/WMSServer?REQUEST=GetMap&SERVICE=WMS&VERSION=1.3.0&FORMAT=image%2Fpng&STYLES=default&TRANSPARENT=true&LAYERS=dmr4g%3AGrayscaleHillshade&WIDTH=256&HEIGHT=256&CRS=EPSG%3A3857&BBOX=1878516.4071364924%2C6574807.42497772%2C2191602.474992574%2C6887893.492833802');
    })

    it('should encode letter ň in Plzeň in the URL path', function() {
      const url = '/https://ags.plzen.eu/arcgis/rest/services/GIS_Historicke/GIS_HIS_Plzeň_1926/MapServer?f=json';
      const safeUrl = encodeUrlPathAndParams(url);
      expect(safeUrl).to.exist;
      expect(safeUrl).to.equal('/https://ags.plzen.eu/arcgis/rest/services/GIS_Historicke/GIS_HIS_Plze%C5%88_1926/MapServer?f=json');
    })

    // Add more test cases as needed
  });
});
