import { expect } from 'chai';

import { proxy, app, splitUrlAtTld, encodeUrlPathAndParams } from '../src/proxy.js';
import { classifyGisRequest } from '../src/proxy/classify.js';
import { isBlockedAddress, validateUpstreamUrl, SsrfError } from '../src/proxy/ssrf.js';

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

  describe('#classifyGisRequest()', function() {
    it('classifies a WMS GetMap request by SERVICE/REQUEST params', function() {
      const url = new URL('https://ags.cuzk.cz/arcgis2/services/dmr4g/ImageServer/WMSServer?SERVICE=WMS&REQUEST=GetMap');
      expect(classifyGisRequest(url).kind).to.equal('wms');
    });

    it('classifies a lowercase WMTS request', function() {
      const url = new URL('https://tile.example.com/wmts?service=wmts&request=GetTile');
      expect(classifyGisRequest(url).kind).to.equal('wmts');
    });

    it('classifies WFS GetFeature', function() {
      const url = new URL('https://geo.example.com/wfs?SERVICE=WFS&REQUEST=GetFeature');
      expect(classifyGisRequest(url).kind).to.equal('wfs');
    });

    it('classifies WCS GetCoverage', function() {
      const url = new URL('https://geo.example.com/wcs?SERVICE=WCS&REQUEST=GetCoverage');
      expect(classifyGisRequest(url).kind).to.equal('wcs');
    });

    it('classifies CSW GetRecords', function() {
      const url = new URL('https://csw.example.com/csw?SERVICE=CSW&REQUEST=GetRecords');
      expect(classifyGisRequest(url).kind).to.equal('csw');
    });

    it('classifies an ArcGIS MapServer path', function() {
      const url = new URL('https://ags.plzen.eu/arcgis/rest/services/GIS_Historicke/GIS_HIS_Plzen_1926/MapServer?f=json');
      expect(classifyGisRequest(url).kind).to.equal('arcgis');
    });

    it('classifies an OGC API Features endpoint', function() {
      const url = new URL('https://demo.example.com/ogcapi/collections/roads/items');
      expect(classifyGisRequest(url).kind).to.equal('ogcapi');
    });

    it('classifies an XYZ tile URL', function() {
      const url = new URL('https://tiles.example.com/layer/12/2048/1365.png');
      expect(classifyGisRequest(url).kind).to.equal('xyz');
    });

    it('classifies Cesium 3D Tiles tileset.json', function() {
      const url = new URL('https://3d.example.com/buildings/tileset.json');
      expect(classifyGisRequest(url).kind).to.equal('cesium');
    });

    it('classifies Cesium terrain layer.json', function() {
      const url = new URL('https://terrain.example.com/world/layer.json');
      expect(classifyGisRequest(url).kind).to.equal('cesium');
    });

    it('classifies GeoNames host as named integration', function() {
      const url = new URL('http://api.geonames.org/searchJSON?name_startsWith=Prague');
      expect(classifyGisRequest(url).kind).to.equal('geonames');
    });

    it('classifies OpenRouteService host as named integration', function() {
      const url = new URL('https://api.openrouteservice.org/v2/directions/driving-car/geojson');
      expect(classifyGisRequest(url).kind).to.equal('ors');
    });

    it('classifies tinyurl host as named integration', function() {
      const url = new URL('http://tinyurl.com/api-create.php?url=http://example.com/');
      expect(classifyGisRequest(url).kind).to.equal('tinyurl');
    });

    it('rejects an arbitrary non-GIS URL', function() {
      const url = new URL('https://example.com/index.html');
      const result = classifyGisRequest(url);
      expect(result.kind).to.equal('reject');
      expect(result.reason).to.be.a('string');
    });

    it('rejects a GeoNames path other than /searchJSON', function() {
      const url = new URL('http://api.geonames.org/export/dump/');
      expect(classifyGisRequest(url).kind).to.equal('reject');
    });

    it('rejects an OGC service with a disallowed REQUEST', function() {
      const url = new URL('https://geo.example.com/wms?SERVICE=WMS&REQUEST=Transaction');
      expect(classifyGisRequest(url).kind).to.equal('reject');
    });
  });

  describe('#isBlockedAddress()', function() {
    const blocked = [
      '127.0.0.1',
      '127.1.2.3',
      '10.0.0.1',
      '172.16.5.4',
      '172.31.255.255',
      '192.168.1.1',
      '169.254.169.254', // cloud metadata
      '0.0.0.0',
      '100.64.0.1',      // CGNAT
      '224.0.0.1',       // multicast
      '::1',
      '::',
      'fe80::1',
      'fc00::1',
      'fd12::1',
      '::ffff:127.0.0.1',
    ];
    for (const ip of blocked) {
      it(`blocks ${ip}`, function() {
        expect(isBlockedAddress(ip)).to.equal(true);
      });
    }

    const allowed = [
      '8.8.8.8',
      '1.1.1.1',
      '93.184.216.34', // example.com
      '2606:4700:4700::1111',
    ];
    for (const ip of allowed) {
      it(`allows ${ip}`, function() {
        expect(isBlockedAddress(ip)).to.equal(false);
      });
    }
  });

  describe('#validateUpstreamUrl()', function() {
    it('accepts https on port 443', function() {
      expect(() => validateUpstreamUrl(new URL('https://example.com/a'))).to.not.throw();
    });

    it('rejects file:// scheme', function() {
      expect(() => validateUpstreamUrl(new URL('file:///etc/passwd'))).to.throw(SsrfError);
    });

    it('rejects URLs with credentials', function() {
      expect(() => validateUpstreamUrl(new URL('https://user:pass@example.com/a'))).to.throw(SsrfError);
    });

    it('rejects non-standard ports', function() {
      expect(() => validateUpstreamUrl(new URL('http://example.com:22/'))).to.throw(SsrfError);
    });

    it('rejects IP-literal loopback', function() {
      expect(() => validateUpstreamUrl(new URL('http://127.0.0.1/'))).to.throw(SsrfError);
    });

    it('rejects IP-literal cloud metadata', function() {
      expect(() => validateUpstreamUrl(new URL('http://169.254.169.254/latest/meta-data/'))).to.throw(SsrfError);
    });
  });

  describe('gateway request handling', function() {
    it('renders an info page at /', async function() {
      const res = await app.fetch(new Request('http://localhost:8085/'));
      expect(res.status).to.equal(200);
      const text = await res.text();
      expect(text).to.contain('hslayers-server GIS gateway');
    });

    it('rejects non-allowed HTTP methods', async function() {
      const res = await app.fetch(new Request('http://localhost:8085/https://example.com/', { method: 'DELETE' }));
      expect(res.status).to.equal(405);
    });

    it('rejects unknown (non-GIS) upstream URLs with 400', async function() {
      const res = await app.fetch(new Request('http://localhost:8085/https://example.com/'));
      expect(res.status).to.equal(400);
    });

    it('rejects URLs with embedded credentials with 403', async function() {
      const res = await app.fetch(new Request('http://localhost:8085/https://user:pass@example.com/wms?SERVICE=WMS&REQUEST=GetCapabilities'));
      expect(res.status).to.equal(403);
    });

    it('rejects IP-literal loopback targets with 403', async function() {
      const res = await app.fetch(new Request('http://localhost:8085/http://127.0.0.1/wms?SERVICE=WMS&REQUEST=GetCapabilities'));
      expect(res.status).to.equal(403);
    });

    it('rejects cloud-metadata IPs with 403', async function() {
      const res = await app.fetch(new Request('http://localhost:8085/http://169.254.169.254/latest/meta-data/?SERVICE=WMS&REQUEST=GetCapabilities'));
      expect(res.status).to.equal(403);
    });

    it('responds to CORS preflight with 204', async function() {
      const res = await app.fetch(new Request('http://localhost:8085/https://example.com/', {
        method: 'OPTIONS',
        headers: { 'access-control-request-method': 'GET', origin: 'http://client.local' },
      }));
      expect(res.status).to.equal(204);
      expect(res.headers.get('access-control-allow-origin')).to.exist;
    });
  });

  // Hang up server once all tests finish
  after(function() {
    proxy.close();
  })
});
