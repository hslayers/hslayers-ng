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

import {HsCommonLaymanService} from '../../common/layman/layman.service';
import {HsConfig} from '../../config.service';
import {HsConfigMock} from '../../config.service.mock';
import {HsCoreService} from '../core/core.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLanguageService} from '../language/language.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsLayoutServiceMock} from '../layout/layout.service.mock';
import {HsMapComponent} from './map.component';
import {HsMapDirective} from './map.directive';
import {HsMapService} from './map.service';
import {HsShareUrlService} from '../permalink/share-url.service';
import {HsShareUrlServiceMock} from '../permalink/share-url.service.mock';
import {HsUtilsService} from '../utils/utils.service';
import {HsUtilsServiceMock} from '../utils/utils.service.mock';
import {mockLanguageService} from '../language/language.service.mock';

class emptyMock {
  constructor() {}
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
    TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [CommonModule],
      declarations: [HsMapComponent, HsMapDirective],
      providers: [
        {provide: HsShareUrlService, useValue: new HsShareUrlServiceMock()},
        {provide: HsCoreService, useValue: new emptyMock()},
        HsMapService,
        {provide: HsLayoutService, useValue: new HsLayoutServiceMock()},
        HsEventBusService,
        {provide: HsUtilsService, useValue: new HsUtilsServiceMock()},
        {provide: HsConfig, useValue: new HsConfigMock()},
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
