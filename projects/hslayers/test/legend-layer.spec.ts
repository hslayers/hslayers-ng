/* eslint-disable prefer-arrow-callback */
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';
import {provideHttpClientTesting} from '@angular/common/http/testing';

import {Circle, Fill, Stroke, Style} from 'ol/style';
import {Feature} from 'ol';
import {Point} from 'ol/geom';
import {Vector as VectorLayer} from 'ol/layer';
import {Vector as VectorSource} from 'ol/source';

import {HsConfig} from 'hslayers-ng/config';
import {HsConfigMock} from './config.service.mock';
import {HsLayerUtilsService} from 'hslayers-ng/services/utils';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {HsLayoutServiceMock} from './layout.service.mock';
import {HsLegendComponent} from 'hslayers-ng/components/legend';
import {HsLegendLayerComponent} from 'hslayers-ng/components/legend';
import {HsLegendLayerStaticComponent} from 'hslayers-ng/components/legend';
import {HsLegendLayerVectorComponent} from 'hslayers-ng/components/legend';
import {HsLegendService} from 'hslayers-ng/components/legend';
import {HsMapService} from 'hslayers-ng/services/map';
import {HsMapServiceMock} from './map.service.mock';
import {HsPanelHelpersModule} from 'hslayers-ng/common/panels';
import {HsUtilsService} from 'hslayers-ng/services/utils';
import {HsUtilsServiceMock} from './utils.service.mock';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';
import {getCluster, setCluster} from 'hslayers-ng/common/extensions';
import {mockLayerUtilsService} from './layer-utils.service.mock';

describe('HsLegendLayerComponent', () => {
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
  let parentComponent: HsLegendComponent;
  let parentFixture: ComponentFixture<HsLegendComponent>;
  let component: HsLegendLayerComponent;
  let fixture: ComponentFixture<HsLegendLayerComponent>;
  let service: HsLegendService;
  beforeEach(async () => {
    const mockedConfig = new HsConfigMock();

    TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      declarations: [
        HsLegendComponent,
        HsLegendLayerComponent,
        HsLegendLayerVectorComponent,
        HsLegendLayerStaticComponent,
      ],
      imports: [HsPanelHelpersModule, FormsModule, TranslateCustomPipe],
      providers: [
        HsLegendService,
        {provide: HsConfig, useValue: mockedConfig},
        {provide: HsUtilsService, useValue: new HsUtilsServiceMock()},
        {provide: HsLayerUtilsService, useValue: mockLayerUtilsService()},
        {provide: HsMapService, useValue: new HsMapServiceMock()},
        {
          provide: HsLayoutService,
          useValue: new HsLayoutServiceMock(mockedConfig),
        },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    parentFixture = TestBed.createComponent(HsLegendComponent);
    parentComponent = parentFixture.componentInstance;
    parentFixture.detectChanges();
    fixture = TestBed.createComponent(HsLegendLayerComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(HsLegendService);
  });
  it('should create', () => {
    expect(parentComponent).toBeTruthy();
  });

  it('should generate vector layer', async () => {
    const count = 20;
    const features = new Array(count);
    const e = 4500000;
    for (let i = 0; i < count; ++i) {
      const coordinates = [
        2 * e * Math.random() - e,
        2 * e * Math.random() - e,
      ];
      features[i] = new Feature({
        geometry: new Point(coordinates),
        name: 'test',
      });
    }
    const layer = new VectorLayer({
      properties: {
        title: 'Bookmarks',
        cluster: true,
        inlineLegend: true,
        editor: {
          editable: true,
          defaultAttributes: {
            name: 'New bookmark',
            description: 'none',
          },
        },
        path: 'User generated',
      },
      source: new VectorSource({features}),
    });
    await parentComponent.addLayerToLegends(layer);
    expect(parentComponent.layerDescriptors.length).toBeDefined();
    expect(parentComponent.layerDescriptors[0].title).toBe('Bookmarks');
  });

  it('should create layer feature style and geometry type', async function () {
    const count = 20;
    const features = new Array(count);
    const e = 4500000;
    for (let i = 0; i < count; ++i) {
      const coordinates = [
        2 * e * Math.random() - e,
        2 * e * Math.random() - e,
      ];
      features[i] = new Feature({
        geometry: new Point(coordinates),
        name: 'test',
      });
    }
    const layer = new VectorLayer({
      properties: {
        title: 'Bookmarks',
        cluster: true,
        inlineLegend: true,
        editor: {
          editable: true,
          defaultAttributes: {
            name: 'New bookmark',
            description: 'none',
          },
        },
        path: 'User generated',
      },
      source: new VectorSource({features}),
    });
    await parentComponent.addLayerToLegends(layer);
    const expectedLayer = parentComponent.layerDescriptors[0];
    component.layer = expectedLayer;
    fixture.detectChanges();
    const svg = await service.getVectorLayerLegendSvg(layer);
    expect(svg).toBeDefined();
  });

  it('should turn off clustered features and change layer style', async function () {
    const count = 20;
    const features = new Array(count);
    const e = 4500000;
    for (let i = 0; i < count; ++i) {
      const coordinates = [
        2 * e * Math.random() - e,
        2 * e * Math.random() - e,
      ];
      features[i] = new Feature({
        geometry: new Point(coordinates),
        name: 'test',
      });
    }
    const layer = new VectorLayer({
      properties: {
        title: 'Bookmarks',
        cluster: true,
        inlineLegend: true,
        editor: {
          editable: true,
          defaultAttributes: {
            name: 'New bookmark',
            description: 'none',
          },
        },
        path: 'User generated',
      },
      source: new VectorSource({features}),
    });
    await parentComponent.addLayerToLegends(layer);
    const expectedLayer = parentComponent.layerDescriptors[0];
    component.layer = expectedLayer;
    fixture.detectChanges();
    setCluster(component.layer.lyr, false);
    fixture.detectChanges();
    const customStyle = new Style({
      image: new Circle({
        fill: new Fill({
          color: 'rgba(255, 0, 0, 0.4)',
        }),
        stroke: new Stroke({
          color: '#ff3333',
          width: 1,
        }),
        radius: 5,
      }),
    });
    (component.layer.lyr as VectorLayer<VectorSource<Feature>>).setStyle(
      customStyle,
    );
    fixture.detectChanges();
    const svg = await service.getVectorLayerLegendSvg(layer);
    expect(getCluster(component.layer.lyr)).toBeFalse();
    expect(svg).toContain(`<svg class="geostyler-legend-renderer" `);
  });
});
