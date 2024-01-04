/* eslint-disable prefer-arrow-callback */
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {HttpClientTestingModule} from '@angular/common/http/testing';

import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import {Circle, Fill, Stroke, Style} from 'ol/style';
import {Vector as VectorLayer} from 'ol/layer';
import {Vector as VectorSource} from 'ol/source';

import {HsConfig} from 'hslayers-ng/config';
import {HsConfigMock} from 'hslayers-ng/config';
import {HsLayerUtilsService} from 'hslayers-ng/shared/utils';
import {HsLayoutService} from 'hslayers-ng/shared/layout';
import {HsLayoutServiceMock} from 'hslayers-ng/shared/layout';
import {HsLegendComponent} from '../legend.component';
import {HsLegendLayerComponent} from './legend-layer.component';
import {HsLegendLayerStaticComponent} from '../legend-layer-static/legend-layer-static.component';
import {HsLegendLayerVectorComponent} from '../legend-layer-vector/legend-layer-vector.component';
import {HsLegendService} from '../legend.service';
import {HsMapService} from 'hslayers-ng/components/map';
import {HsMapServiceMock} from 'hslayers-ng/components/map';
import {HsPanelHelpersModule} from 'hslayers-ng/common/panels';
import {HsUiExtensionsModule} from 'hslayers-ng/common/widgets';
import {HsUtilsService} from 'hslayers-ng/shared/utils';
import {HsUtilsServiceMock} from 'hslayers-ng/shared/utils';
import {TranslateCustomPipe} from 'hslayers-ng/shared/language';
import {getCluster, setCluster} from 'hslayers-ng/common/extensions';
import {mockLayerUtilsService} from 'hslayers-ng/shared/utils';

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
      imports: [
        HsPanelHelpersModule,
        HsUiExtensionsModule,
        HttpClientTestingModule,
        FormsModule,
        TranslateCustomPipe,
      ],
      declarations: [
        HsLegendComponent,
        HsLegendLayerComponent,
        HsLegendLayerVectorComponent,
        HsLegendLayerStaticComponent,
      ],
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
    component.layer.lyr.setStyle(customStyle);
    fixture.detectChanges();
    const svg = await service.getVectorLayerLegendSvg(layer);
    expect(getCluster(component.layer.lyr)).toBeFalse();
    expect(svg).toContain(`<svg class="geostyler-legend-renderer" `);
  });
});
