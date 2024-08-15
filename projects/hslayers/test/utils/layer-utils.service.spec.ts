import proj4 from 'proj4'; // Update the path as needed
import {HsLayerUtilsService} from 'hslayers-ng/services/utils';
import {Projection} from 'ol/proj';
import {TestBed} from '@angular/core/testing';
import {get as getProjection} from 'ol/proj';
import {provideHttpClient} from '@angular/common/http';
import {provideHttpClientTesting} from '@angular/common/http/testing';
import {register} from 'ol/proj/proj4';

describe('LayerUtilsService', () => {
  let service: HsLayerUtilsService;

  proj4.defs(
    'EPSG:4087',
    '+proj=cea +lon_0=0 +lat_ts=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs',
  );
  proj4.defs(
    'http://www.opengis.net/gml/srs/epsg.xml#4087',
    proj4.defs('EPSG:4087'),
  );

  proj4.defs(
    'EPSG:5514',
    '+proj=krovak +lat_0=49.5 +lon_0=24.83333333333333 +alpha=30.28813972222222 +k=0.9999 +x_0=0 +y_0=0 +ellps=bessel +towgs84=542.5,89.2,456.9,5.517,2.275,5.516,6.96 +units=m +no_defs',
  );
  proj4.defs(
    'http://www.opengis.net/gml/srs/epsg.xml#5514',
    proj4.defs('EPSG:5514'),
  );

  register(proj4);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(HsLayerUtilsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  fdescribe('bufferExtent', () => {
    it('should buffer extent correctly in meters', () => {
      const extent = [1000, 2000, 3000, 4000];
      const bufferedExtent = service.bufferExtent(
        extent,
        getProjection('EPSG:3857'),
      );

      expect(bufferedExtent[0]).toBeLessThan(1000);
      expect(bufferedExtent[1]).toBeLessThan(2000);
      expect(bufferedExtent[2]).toBeGreaterThan(3000);
      expect(bufferedExtent[3]).toBeGreaterThan(4000);
    });

    it('should buffer extent correctly with degree units (WGS84)', () => {
      const extent = [-75, 40, -70, 45];
      const bufferedExtent = service.bufferExtent(
        extent,
        getProjection('EPSG:4326'),
      );

      expect(bufferedExtent[0]).toBeLessThan(-75);
      expect(bufferedExtent[1]).toBeLessThan(40);
      expect(bufferedExtent[2]).toBeGreaterThan(-70);
      expect(bufferedExtent[3]).toBeGreaterThan(45);
      console.log(bufferedExtent);
    });

    it('should not extend extent beyond WGS84 bounds', () => {
      const extremeExtent = [-300, -90, 180, 90]; // Edge of WGS84 bounds
      const bufferedExtent = service.bufferExtent(
        extremeExtent,
        getProjection('EPSG:4326'),
      );

      expect(bufferedExtent[0]).toBeGreaterThanOrEqual(-180);
      expect(bufferedExtent[1]).toBeGreaterThanOrEqual(-90);
      expect(bufferedExtent[2]).toBeLessThanOrEqual(180);
      expect(bufferedExtent[3]).toBeLessThanOrEqual(90);
    });

    it('should buffer extent correctly in EPSG:5514', () => {
      const extent = [
        -737118.8198068674, -1010163.8964222762, -701407.4374141559,
        -982026.5783390203,
      ];
      const bufferedExtent = service.bufferExtent(
        extent,
        getProjection('EPSG:5514'),
      );

      expect(bufferedExtent[0]).toBeLessThan(-737118.8198068674);
      expect(bufferedExtent[1]).toBeLessThan(-1010163.8964222762);
      expect(bufferedExtent[2]).toBeGreaterThan(-701407.4374141559);
      expect(bufferedExtent[3]).toBeGreaterThan(-982026.5783390203);
    });

    fit('should clamp and buffer extent correctly outside bounds in EPSG:5514', () => {
      // Define an extent that is outside the EPSG:5514 bounds
      const extent = [-1000000, -1400000, -100000, -900000];
      const bufferedExtent = service.bufferExtent(
        extent,
        getProjection('EPSG:5514'),
      );

      // Expected clamped extent within the bounds for EPSG:5514
      expect(bufferedExtent[0]).toBeGreaterThanOrEqual(-951499.37);
      expect(bufferedExtent[1]).toBeGreaterThanOrEqual(-1353292.51);
      expect(bufferedExtent[2]).toBeLessThanOrEqual(-159365.31);
      expect(bufferedExtent[3]).toBeLessThanOrEqual(-911053.67);
    });
  });
});
