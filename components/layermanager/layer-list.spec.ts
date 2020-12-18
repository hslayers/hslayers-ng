/* eslint-disable prefer-arrow-callback */
/* eslint-disable angular/no-service-method */
/* eslint-disable angular/di */
'use strict';
import VectorLayer from 'ol/layer/Vector';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {HsConfig} from '../../config.service';
import {HsDrawService} from '../draw/draw.service';
import {HsLayerListComponent} from './layermanager-layerlist.component';
import {HsLayerManagerService} from './layermanager.service';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsMapService} from '../map/map.service';
import {HsMapServiceMock} from '../map/map.service.mock';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';
import {HsShareUrlService} from '../permalink/share-url.service';
import {HsUtilsService} from '../utils/utils.service';
import {HsUtilsServiceMock} from '../utils/utils.service.mock';
import {HsWfsGetCapabilitiesService} from '../../common/wfs/get-capabilities.service';
import {HsWmsGetCapabilitiesService} from '../../common/wms/get-capabilities.service';
import {HsWmtsGetCapabilitiesService} from '../../common/wmts/get-capabilities.service';
import {Image as ImageLayer, Tile} from 'ol/layer';
import {ImageWMS} from 'ol/source';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {TranslateModule} from '@ngx-translate/core';
import {Vector as VectorSource} from 'ol/source';
import {wmsGetCapabilitiesResponse} from '../../test/data/wms-capabilities';

class HsConfigMock {
  layer_order = '-position';
  constructor() {}
}

class emptyMock {
  constructor() {}
}

describe('layermanager-layer-list', () => {
  let component: HsLayerListComponent;
  let fixture: ComponentFixture<HsLayerListComponent>;

  const layerForCluster = new VectorLayer({
    title: 'Bookmarks',
    source: new VectorSource({}),
  });

  const subLayerContainerLayer = new ImageLayer({
    title: 'test',
    source: new ImageWMS({
      url: 'http://geoservices.brgm.fr/geologie',
      params: {'LAYERS': 'BSS', 'TILED': true},
    }),
    crossOrigin: 'anonymous',
  });

  beforeAll(() => {
    TestBed.resetTestEnvironment();
    TestBed.initTestEnvironment(
      BrowserDynamicTestingModule,
      platformBrowserDynamicTesting()
    );
  });

  beforeEach(() => {
    const bed = TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [
        HsPanelHelpersModule,
        FormsModule,
        NgbModule,
        TranslateModule.forRoot(),
      ],
      declarations: [HsLayerListComponent],
      providers: [
        HsLayerManagerService,
        {provide: HsWmtsGetCapabilitiesService, useValue: new emptyMock()},
        {
          provide: HsWmsGetCapabilitiesService,
          useValue: {
            requestGetCapabilities: (service_url) =>
              new Promise((resolve, reject) => {
                resolve(wmsGetCapabilitiesResponse);
              }),
          },
        },
        {provide: HsWfsGetCapabilitiesService, useValue: new emptyMock()},
        {provide: HsUtilsService, useValue: new HsUtilsServiceMock()},
        {
          provide: HsUtilsService,
          useValue: new HsUtilsServiceMock(),
        },
        {
          provide: HsLayerUtilsService,
          useValue: {
            isLayerVectorLayer: () => false,
            getLayerTitle: () => '',
            getURL: () => 'http://dummy-layer-url',
            isLayerWMS: () => true,
          },
        },
        {provide: HsMapService, useValue: new HsMapServiceMock()},
        {
          provide: HsShareUrlService,
          useValue: {
            getParamValue: () => undefined,
          },
        },
        {provide: HsConfig, useValue: new HsConfigMock()},
        {provide: HsDrawService, useValue: new HsConfigMock()},
        {provide: HsLayoutService, useValue: new emptyMock()},
      ],
    });
    //bed.compileComponents();
  });

  beforeEach(() => {
    spyOn(window.console, 'error');
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HsLayerListComponent);
    component = fixture.componentInstance;
    component.folder = {layers: []};
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should list sublayers', () => {
    component['HsLayerManagerService'].layerAdded({
      element: subLayerContainerLayer,
    });
    expect(component).toBeTruthy();
    expect(window.console.error).not.toHaveBeenCalled();
  });
});
