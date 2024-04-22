import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {HttpClientTestingModule} from '@angular/common/http/testing';

import {Image as ImageLayer} from 'ol/layer';
import {ImageWMS} from 'ol/source';
import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';

import {HsAddDataOwsService} from 'hslayers-ng/services/add-data';
import {
  HsArcgisGetCapabilitiesService,
  HsWfsGetCapabilitiesService,
  HsWmsGetCapabilitiesService,
  HsWmtsGetCapabilitiesService,
} from 'hslayers-ng/services/get-capabilities';
import {HsConfig} from 'hslayers-ng/config';
import {HsConfigMock} from './config.service.mock';
import {HsDrawService} from 'hslayers-ng/services/draw';
import {HsLanguageModule} from 'hslayers-ng/components/language';
import {HsLayerListComponent} from 'hslayers-ng/components/layer-manager';
import {HsLayerListService} from 'hslayers-ng/components/layer-manager';
import {HsLayerManagerService} from 'hslayers-ng/services/layer-manager';
import {HsLayerUtilsService} from 'hslayers-ng/services/utils';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {HsLayoutServiceMock} from './layout.service.mock';
import {HsMapService} from 'hslayers-ng/services/map';
import {HsMapServiceMock} from './map.service.mock';
import {HsPanelHelpersModule} from 'hslayers-ng/common/panels';
import {HsShareUrlService} from 'hslayers-ng/services/share';
import {HsUtilsService} from 'hslayers-ng/services/utils';
import {HsUtilsServiceMock} from './utils.service.mock';

import {mockHsLayerListService} from './layer-manager-layerlist.service.mock';
import {mockLayerUtilsService} from './layer-utils.service.mock';
import {wmsGetCapabilitiesResponse} from './data/wms-capabilities';

class emptyMock {
  constructor() {}
}

const layerUtilsMock = mockLayerUtilsService();
describe('layermanager-layer-list', () => {
  let component: HsLayerListComponent;
  let fixture: ComponentFixture<HsLayerListComponent>;
  const params = {'LAYERS': 'BSS', 'TILED': true};
  let subLayerContainerLayer;
  layerUtilsMock.getLayerParams.and.returnValue(params);
  let hsConfig: HsConfig;
  beforeAll(() => {
    subLayerContainerLayer = new ImageLayer({
      properties: {title: 'test'},
      source: new ImageWMS({
        url: 'http://geoservices.brgm.fr/geologie',
        params,
        crossOrigin: 'anonymous',
      }),
    });
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

    const bed = TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [
        HsPanelHelpersModule,
        FormsModule,
        NgbDropdownModule,
        HsLanguageModule,
        HttpClientTestingModule,
      ],
      declarations: [HsLayerListComponent],
      providers: [
        HsLayerManagerService,
        {provide: HsLayerListService, useValue: mockHsLayerListService()},
        {provide: HsArcgisGetCapabilitiesService, useValue: new emptyMock()},
        {provide: HsWmtsGetCapabilitiesService, useValue: new emptyMock()},
        {provide: HsAddDataOwsService, useValue: new emptyMock()},
        {
          provide: HsWmsGetCapabilitiesService,
          useValue: {
            request: (service_url) =>
              new Promise((resolve, reject) => {
                resolve({response: wmsGetCapabilitiesResponse});
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
          useValue: layerUtilsMock,
        },
        {provide: HsMapService, useValue: new HsMapServiceMock()},
        {
          provide: HsShareUrlService,
          useValue: {
            getParamValue: () => undefined,
          },
        },
        {provide: HsConfig, useValue: mockedConfig},
        {provide: HsDrawService, useValue: new emptyMock()},
        {
          provide: HsLayoutService,
          useValue: new HsLayoutServiceMock(mockedConfig),
        },
      ],
    });
    //bed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HsLayerListComponent);
    hsConfig = TestBed.inject(HsConfig);
    component = fixture.componentInstance;
    component.folder = {layers: []};
    fixture.detectChanges();
    hsConfig.reverseLayerList = true;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should list sublayers', () => {
    component['hsLayerManagerService'].layerAdded(
      {
        element: subLayerContainerLayer,
      },
      true,
    );
    expect(component).toBeTruthy();
  });
});
