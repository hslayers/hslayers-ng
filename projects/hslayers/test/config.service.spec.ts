import {HsConfig, HsConfigObject} from 'hslayers-ng/config';
import {OSM, TileWMS} from 'ol/source';
import {TestBed} from '@angular/core/testing';
import {Tile} from 'ol/layer';
import {provideTranslateService} from '@ngx-translate/core';

describe('HsConfig', () => {
  let service: HsConfig;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HsConfig, provideTranslateService()],
    });
    service = TestBed.inject(HsConfig);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('update()', () => {
    it('should handle complex configuration with layers and translations', () => {
      const osmLayer = new Tile({
        source: new OSM(),
        visible: true,
        properties: {
          title: 'OpenStreet Map',
          base: true,
          removable: false,
        },
      });

      const wmsLayer = new Tile({
        source: new TileWMS({
          url: 'http://test.org/wms',
          params: {LAYERS: 'test'},
        }),
        properties: {
          title: 'Test WMS',
          dimensions: {time: {value: '2020-01-11'}},
        },
        visible: false,
      });

      const complexConfig: HsConfigObject = {
        panelsEnabled: {
          draw: true,
          mapSwipe: true,
          language: true,
          tripPlanner: true,
        },
        componentsEnabled: {
          basemapGallery: true,
          mapSwipe: false,
        },
        sidebarPosition: 'right',
        panelWidths: {
          custom: 555,
          print: 500,
        },
        open_lm_after_comp_loaded: false,
        queryPopupWidgets: [
          'analysis',
          'layer-name',
          'feature-info',
          'clear-layer',
        ],
        datasources: [
          {
            title: 'Test source',
            url: 'http://test.org',
            type: 'test',
          },
        ],
        proxyPrefix: 'http://localhost:8085/',
        mapSwipeOptions: {
          orientation: 'vertical' as const,
        },
        enabledLanguages: 'sk, cs, en, la',
        language: 'en',
        assetsPath: 'assets',
        saveMapStateOnReload: false,
        default_layers: [osmLayer, wmsLayer],
        timeDisplayFormat: 'dd.MM.yyyy.',
        additionalLanguages: {
          la: 'Lingua Latina',
        },
        translationOverrides: {
          cs: {
            'My Cool Panel': 'Můj úžasný panel',
          },
          sk: {
            'My Cool Panel': 'Môj úžasný panel',
          },
        },
        defaultPanel: 'custom',
      };

      service.update(complexConfig);

      // Test panels configuration
      expect(service.panelsEnabled.draw).toBeTrue();
      expect(service.panelsEnabled.mapSwipe).toBeTrue();
      expect(service.panelsEnabled.language).toBeTrue();

      // Test components configuration
      expect(service.componentsEnabled.basemapGallery).toBeTrue();
      expect(service.componentsEnabled.mapSwipe).toBeFalse();

      // Test panel widths
      expect(service.panelWidths.custom).toBe(555);
      expect(service.panelWidths.print).toBe(500);

      // Test language settings
      expect(service.language).toBe('en');
      expect(service.enabledLanguages).toBe('sk, cs, en, la');
      expect(service.additionalLanguages.la).toBe('Lingua Latina');

      // Test translation overrides
      expect(service.translationOverrides.cs['My Cool Panel']).toBe(
        'Můj úžasný panel',
      );
      expect(service.translationOverrides.sk['My Cool Panel']).toBe(
        'Môj úžasný panel',
      );

      // Test default layers
      expect(service.default_layers.length).toBe(2);
      expect(service.default_layers[0].getVisible()).toBeTrue();
      expect(service.default_layers[1].getVisible()).toBeFalse();
    });

    it('should handle symbolizer icons configuration', () => {
      const config: Partial<HsConfigObject> = {
        assetsPath: '/assets',
        symbolizerIcons: [
          {name: 'bag', url: '/assets/icons/bag1.svg'},
          {name: 'banking', url: '/assets/icons/banking4.svg'},
          {name: 'bar', url: '/assets/icons/bar.svg'},
        ],
      };

      service.update(config as HsConfigObject);
      expect(service.symbolizerIcons.length).toBe(7); // 4 default + 3 new
      expect(service.symbolizerIcons).toContain(
        jasmine.objectContaining({
          name: 'bag',
          url: '/assets/icons/bag1.svg',
        }),
      );
    });

    it('should handle query popup widgets configuration', () => {
      const config: Partial<HsConfigObject> = {
        queryPopupWidgets: ['analysis', 'layer-name', 'feature-info'],
        customQueryPopupWidgets: [{name: 'analysis', component: {} as any}],
      };

      service.update(config as HsConfigObject);
      expect(service.queryPopupWidgets).toEqual([
        'analysis',
        'layer-name',
        'feature-info',
      ]);
      expect(service.customQueryPopupWidgets.length).toBe(1);
      expect(service.customQueryPopupWidgets[0].name).toBe('analysis');
    });

    it('should handle map swipe options', () => {
      const config: Partial<HsConfigObject> = {
        mapSwipeOptions: {
          orientation: 'vertical' as const,
        },
      };

      service.update(config as HsConfigObject);
      expect(service.mapSwipeOptions.orientation).toBe('vertical');
    });

    it('should handle data sources configuration', () => {
      const config: Partial<HsConfigObject> = {
        datasources: [
          {
            title: 'Layman',
            url: 'http://localhost:8087',
            type: 'layman',
          },
          {
            title: 'Micka',
            url: 'https://test.com/micka/csw',
            language: 'eng',
            type: 'micka',
          },
        ],
      };

      service.update(config as HsConfigObject);
      expect(service.datasources.length).toBe(2);
      expect(service.datasources[0].title).toBe('Layman');
      expect(service.datasources[1].type).toBe('micka');
    });

    it('should handle error when updating invalid data source', () => {
      const spy = spyOn(console, 'warn');
      const config = {
        componentsEnabled: new Proxy(
          {},
          {
            get() {
              throw new Error('Simulated error');
            },
          },
        ),
      };

      service.update(config as any);
      expect(spy).toHaveBeenCalledWith(
        'HsConfig Warning:',
        jasmine.stringMatching(
          /Error in updateComponentsEnabled, using defaults: Simulated error/,
        ),
      );
    });

    it('should preserve default values when updating with partial config', () => {
      const originalPanelWidths = {...service.panelWidths};
      const originalComponentsEnabled = {...service.componentsEnabled};

      service.update({
        panelWidths: {
          custom: 600,
        },
      } as HsConfigObject);

      expect(service.panelWidths.custom).toBe(600);
      expect(service.panelWidths.default).toBe(originalPanelWidths.default);
      expect(service.componentsEnabled).toEqual(originalComponentsEnabled);
    });

    it('should preserve order of keys from new config', () => {
      const newConfig: Partial<HsConfigObject> = {
        componentsEnabled: {
          mapSwipe: true,
          basemapGallery: false,
          guiOverlay: false,
        },
      };
      service.update(newConfig as HsConfigObject);
      const keys = Object.keys(service.componentsEnabled);
      expect(keys[0]).toBe('mapSwipe');
      expect(keys[1]).toBe('basemapGallery');
      expect(keys.indexOf('guiOverlay')).toBeGreaterThan(1);
    });

    it('should handle empty or undefined config gracefully', () => {
      const spy = spyOn(console, 'warn');
      service.update(undefined);
      expect(spy).toHaveBeenCalledWith(
        'HsConfig Warning:',
        'Empty configuration provided',
      );

      // Should preserve default values
      expect(service.componentsEnabled.guiOverlay).toBeTrue();
      expect(service.panelWidths.default).toBe(425);
    });

    it('should warn about deprecated Cesium config', () => {
      const spy = spyOn(console, 'error');
      const newConfig = {
        cesiumDebugShowFramesPerSecond: true,
        cesiumShadows: true,
      } as any;

      service.update(newConfig);
      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy.calls.argsFor(0)[0]).toContain(
        'HsConfig.cesiumDebugShowFramesPerSecond',
      );
    });

    it('should handle bottom sidebar position special case', () => {
      const config: Partial<HsConfigObject> = {
        sidebarPosition: 'bottom',
      };

      service.update(config as HsConfigObject);
      expect(service.mobileBreakpoint).toBe(9999);
    });

    it('should emit configChanges when update is called', (done) => {
      service.configChanges.subscribe(() => {
        expect(true).toBeTrue();
        done();
      });
      service.update({} as HsConfigObject);
    });
  });

  describe('updateSymbolizers()', () => {
    it('should handle undefined assetsPath', () => {
      const config = {} as HsConfigObject;
      const result = service.updateSymbolizers(config);
      expect(result[0].url).not.toContain('undefined');
      expect(result[0].url).toContain('img/icons/');
    });

    it('should append trailing slash to assetsPath if missing', () => {
      const config = {
        assetsPath: 'test/path',
      } as HsConfigObject;

      const result = service.updateSymbolizers(config);
      expect(result[0].url).toContain('test/path/');
    });
  });

  describe('setAppId()', () => {
    it('should set app id correctly', () => {
      service.setAppId('test-app');
      expect(service.id).toBe('test-app');
    });
  });
});
