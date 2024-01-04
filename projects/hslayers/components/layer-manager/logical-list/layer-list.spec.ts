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

import {HsAddDataOwsService} from 'hslayers-ng/components/add-data';
import {
  HsArcgisGetCapabilitiesService,
  HsWfsGetCapabilitiesService,
  HsWmsGetCapabilitiesService,
  HsWmtsGetCapabilitiesService,
} from 'hslayers-ng/shared/get-capabilities';
import {HsConfig} from 'hslayers-ng/config';
import {HsConfigMock} from 'hslayers-ng/config';
import {HsDrawService} from 'hslayers-ng/shared/draw';
import {HsLanguageModule} from 'hslayers-ng/components/language';
import {HsLayerListComponent} from './layer-manager-layerlist.component';
import {HsLayerListService} from './layer-manager-layerlist.service';
import {HsLayerManagerService} from 'hslayers-ng/shared/layer-manager'
import {HsLayerUtilsService} from 'hslayers-ng/shared/utils';
import {HsLayoutService} from 'hslayers-ng/shared/layout';
import {HsLayoutServiceMock} from 'hslayers-ng/shared/layout';
import {HsMapService} from 'hslayers-ng/shared/map';
import {HsMapServiceMock} from 'hslayers-ng/shared/map';
import {HsPanelHelpersModule} from 'hslayers-ng/common/panels';
import {HsShareUrlService} from 'hslayers-ng/components/share';
import {HsUtilsService} from 'hslayers-ng/shared/utils';
import {HsUtilsServiceMock} from 'hslayers-ng/shared/utils';

import {mockHsLayerListService} from './layer-manager-layerlist.service.mock';
import {mockLayerUtilsService} from 'hslayers-ng/shared/utils';
import {wmsGetCapabilitiesResponse} from '../../../../test/data/wms-capabilities';

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
