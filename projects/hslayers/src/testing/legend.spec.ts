import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {HttpClientTestingModule} from '@angular/common/http/testing';

import {Tile as TileLayer} from 'ol/layer';
import {TileWMS} from 'ol/source';

import {HsConfig} from 'hslayers-ng/config';
import {HsConfigMock} from './config.service.mock';
import {HsLayerUtilsService} from 'hslayers-ng/shared/utils';
import {HsLayoutService} from 'hslayers-ng/shared/layout';
import {HsLayoutServiceMock} from './layout.service.mock';
import {HsLegendComponent} from 'hslayers-ng/components/legend';
import {HsLegendLayerComponent} from 'hslayers-ng/components/legend';
import {HsLegendLayerStaticComponent} from 'hslayers-ng/components/legend';
import {HsLegendLayerVectorComponent} from 'hslayers-ng/components/legend';
import {HsMapService} from 'hslayers-ng/shared/map';
import {HsMapServiceMock} from './map.service.mock';
import {HsPanelHeaderComponent} from 'hslayers-ng/common/panels';
import {HsPanelHelpersModule} from 'hslayers-ng/common/panels';
import {HsUtilsService} from 'hslayers-ng/shared/utils';
import {HsUtilsServiceMock} from './utils.service.mock';
import {TranslateCustomPipe} from 'hslayers-ng/shared/language';
import {mockLayerUtilsService} from './layer-utils.service.mock';

const layerUtilsMock = mockLayerUtilsService();
describe('HsLegendComponent', () => {
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

  let component: HsLegendComponent;
  let fixture: ComponentFixture<HsLegendComponent>;
  beforeEach(() => {
    const mockedConfig = new HsConfigMock();

    const bed = TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [
        HsPanelHelpersModule,
        HsPanelHeaderComponent,
        TranslateCustomPipe,
        HttpClientTestingModule,
        FormsModule,
      ],
      declarations: [
        HsLegendComponent,
        HsLegendLayerComponent,
        HsLegendLayerVectorComponent,
        HsLegendLayerStaticComponent,
      ],
      providers: [
        {provide: HsConfig, useValue: mockedConfig},
        {provide: HsUtilsService, useValue: new HsUtilsServiceMock()},
        {provide: HsLayerUtilsService, useValue: layerUtilsMock},
        {provide: HsMapService, useValue: new HsMapServiceMock()},
        {
          provide: HsLayoutService,
          useValue: new HsLayoutServiceMock(mockedConfig),
        },
      ],
    });
    //bed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HsLegendComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should generate descriptor', async () => {
    const params = {
      LAYERS: '2017_yield_corn',
      FORMAT: 'image/png',
    };
    const layer = new TileLayer({
      properties: {title: 'Crop stats', showInLayerManager: false},
      source: new TileWMS({
        url: 'http://localhost/ows?',
        params,
      }),
      visible: true,
    });
    layerUtilsMock.isLayerWMS.and.returnValue(true);
    layerUtilsMock.getLayerParams.and.returnValue(params);
    layerUtilsMock.getURL.and.returnValue('http://localhost/ows?');

    await component.addLayerToLegends(layer);

    expect(component.layerDescriptors.length).toBeDefined();

    expect(component.layerDescriptors[0].type).toBe('wms');
    expect(component.layerDescriptors[0].title).toBe('Crop stats');
    expect(component.layerDescriptors[0].subLayerLegends).toEqual([
      '/proxy/http://localhost/ows?&version=1.3.0&service=WMS&request=GetLegendGraphic&sld_version=1.1.0&layer=2017_yield_corn&format=image%2Fpng',
    ]);
  });

  it('should follow wms source LAYERS change', fakeAsync(async () => {
    const layer = new TileLayer({
      properties: {title: 'Crop stats', showInLayerManager: false},
      source: new TileWMS({
        url: 'http://localhost/ows?',
        params: {
          LAYERS: '2017_yield_corn',
          FORMAT: 'image/png',
        },
      }),
      visible: true,
    });
    await component.addLayerToLegends(layer);
    const layerParams = layer.getSource().getParams();
    layerParams.LAYERS = `2017_damage_tomato`;
    layerUtilsMock.getLayerParams.and.returnValue(layerParams);
    layer.getSource().updateParams(layerParams);
    tick(250);
    expect(component.layerDescriptors[0].subLayerLegends).toEqual([
      '/proxy/http://localhost/ows?&version=1.3.0&service=WMS&request=GetLegendGraphic&sld_version=1.1.0&layer=2017_damage_tomato&format=image%2Fpng',
    ]);
  }));
});
