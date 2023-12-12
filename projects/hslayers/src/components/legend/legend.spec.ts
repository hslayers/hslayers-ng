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

import {HsConfig} from '../../config.service';
import {HsConfigMock} from '../../config.service.mock';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsLayoutServiceMock} from '../layout/layout.service.mock';
import {HsLegendComponent} from './legend.component';
import {HsLegendLayerComponent} from './legend-layer/legend-layer.component';
import {HsLegendLayerStaticComponent} from './legend-layer-static/legend-layer-static.component';
import {HsLegendLayerVectorComponent} from './legend-layer-vector/legend-layer-vector.component';
import {HsMapService} from '../map/map.service';
import {HsMapServiceMock} from '../map/map.service.mock';
import {HsPanelHeaderComponent} from '../layout/panels/panel-header/panel-header.component';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';
import {HsUiExtensionsModule} from '../../common/widgets/ui-extensions.module';
import {HsUtilsService} from '../utils/utils.service';
import {HsUtilsServiceMock} from '../utils/utils.service.mock';
import {TranslateCustomPipe} from '../language/translate-custom.pipe';
import {mockLayerUtilsService} from '../utils/layer-utils.service.mock';

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
        HsUiExtensionsModule,
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
