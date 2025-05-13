import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ComponentFixture, TestBed} from '@angular/core/testing';

import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import {Vector as VectorLayer} from 'ol/layer';
import {Vector as VectorSource} from 'ol/source';

import {HsCommonLaymanService} from 'hslayers-ng/common/layman';
import {HsConfig} from 'hslayers-ng/config';
import {HsConfigMock} from './config.service.mock';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsLanguageService} from 'hslayers-ng/services/language';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {HsLayoutServiceMock} from './layout.service.mock';
import {
  HsMapComponent,
  HsMapDirective,
  HslayersService,
} from 'hslayers-ng/core';
import {HsMapService} from 'hslayers-ng/services/map';
import {HsShareUrlService} from 'hslayers-ng/services/share';
import {HsShareUrlServiceMock} from './share-url.service.mock';

class emptyMock {
  constructor() {}
}

function mockLanguageService() {
  return jasmine.createSpyObj('HsLanguageService', [
    'getTranslation',
    'getTranslationIgnoreNonExisting',
    'getTranslator',
    'setLanguage',
    'getCurrentLanguageCode',
    'listAvailableLanguages',
    'awaitTranslation',
  ]);
}

describe('HsMapService', () => {
  let fixture: ComponentFixture<HsMapComponent>;
  let component: HsMapComponent;
  let service: HsMapService;
  beforeAll(() => {
    TestBed.resetTestEnvironment();
    TestBed.initTestEnvironment(
      BrowserDynamicTestingModule,
      platformBrowserDynamicTesting(),
      {
        teardown: {destroyAfterEach: false},
      },
    );
  });
  beforeEach(() => {
    const mockedConfig = new HsConfigMock();

    TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [CommonModule, HsMapComponent, HsMapDirective],
      providers: [
        {provide: HsShareUrlService, useValue: new HsShareUrlServiceMock()},
        {provide: HslayersService, useValue: new emptyMock()},
        HsMapService,
        {
          provide: HsLayoutService,
          useValue: new HsLayoutServiceMock(mockedConfig),
        },
        HsEventBusService,
        {provide: HsConfig, useValue: mockedConfig},
        {provide: HsLanguageService, useValue: mockLanguageService()},
        {
          provide: HsCommonLaymanService,
          useValue: {
            layman: null,
          },
        },
      ],
    }); //.compileComponents();
    fixture = TestBed.createComponent(HsMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    service = TestBed.inject(HsMapService);
  });

  it('Map component should be available', () => {
    expect(component).toBeTruthy();
  });

  it('should create map object', async () => {
    const map = await service.loaded();
    expect(map).toBeDefined();
  });

  it('should not add duplicate layers', async () => {
    await service.loaded();
    const layer1 = new VectorLayer({
      properties: {title: 'Bookmarks'},
      source: new VectorSource({}),
    });
    service.map.addLayer(layer1);

    const layer2 = new VectorLayer({
      properties: {title: 'Bookmarks'},
      source: new VectorSource({}),
    });
    const exists = service.layerAlreadyExists(layer2);
    expect(exists).toBe(true);
  });

  it('find layer for feature', async () => {
    await service.loaded();
    const featureLayer = new VectorLayer({
      properties: {title: 'Feature layer'},
      source: new VectorSource({}),
    });
    service.map.addLayer(featureLayer);
    const feature = new Feature({geometry: new Point([0, 0]), name: 'test'});
    featureLayer.getSource().addFeatures([feature]);
    const foundLayer = service.getLayerForFeature(feature);
    expect(foundLayer).toBe(featureLayer);
  });
});
