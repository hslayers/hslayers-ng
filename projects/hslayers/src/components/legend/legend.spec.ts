import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {Tile as TileLayer} from 'ol/layer';
import {TileWMS} from 'ol/source';
import {TranslateModule} from '@ngx-translate/core';

import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsLayoutServiceMock} from '../layout/layout.service.mock';
import {HsLegendComponent} from './legend.component';
import {HsLegendLayerComponent} from './legend-layer.component';
import {HsLegendLayerStaticComponent} from './legend-layer-static.component';
import {HsLegendLayerVectorComponent} from './legend-layer-vector.component';
import {HsMapService} from '../map/map.service';
import {HsMapServiceMock} from '../map/map.service.mock';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';
import {HsUiExtensionsModule} from '../../common/widgets/ui-extensions.module';
import {HsUtilsService} from '../utils/utils.service';
import {HsUtilsServiceMock} from '../utils/utils.service.mock';
import {mockLayerUtilsService} from '../utils/layer-utils.service.mock';

describe('HsLegendComponent', () => {
  beforeAll(() => {
    TestBed.resetTestEnvironment();
    TestBed.initTestEnvironment(
      BrowserDynamicTestingModule,
      platformBrowserDynamicTesting()
    );
  });

  let component: HsLegendComponent;
  let fixture: ComponentFixture<HsLegendComponent>;

  beforeEach(() => {
    const bed = TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [
        HsPanelHelpersModule,
        HsUiExtensionsModule,
        TranslateModule.forRoot(),
        FormsModule,
      ],
      declarations: [
        HsLegendComponent,
        HsLegendLayerComponent,
        HsLegendLayerVectorComponent,
        HsLegendLayerStaticComponent,
      ],
      providers: [
        {provide: HsUtilsService, useValue: new HsUtilsServiceMock()},
        {provide: HsLayerUtilsService, useValue: mockLayerUtilsService},
        {provide: HsMapService, useValue: new HsMapServiceMock()},
        {provide: HsLayoutService, useValue: new HsLayoutServiceMock()},
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

  it('should generate descriptor', () => {
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

    component.addLayerToLegends(layer);

    expect(component.layerDescriptors.length).toBeDefined();

    expect(component.layerDescriptors[0].type).toBe('wms');
    expect(component.layerDescriptors[0].title).toBe('Crop stats');
    expect(component.layerDescriptors[0].subLayerLegends).toEqual([
      '/proxy/http://localhost/ows?&version=1.3.0&service=WMS&request=GetLegendGraphic&sld_version=1.1.0&layer=2017_yield_corn&format=image%2Fpng',
    ]);
  });

  it('should follow wms source LAYERS change', () => {
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
    component.addLayerToLegends(layer);
    const layerParams = layer.getSource().getParams();
    layerParams.LAYERS = `2017_damage_tomato`;
    layer.getSource().updateParams(layerParams);
    expect(component.layerDescriptors[0].subLayerLegends).toEqual([
      '/proxy/http://localhost/ows?&version=1.3.0&service=WMS&request=GetLegendGraphic&sld_version=1.1.0&layer=2017_damage_tomato&format=image%2Fpng',
    ]);
  });
});
