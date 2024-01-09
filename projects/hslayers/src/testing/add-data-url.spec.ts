import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {HttpClient, HttpClientModule} from '@angular/common/http';
import {lastValueFrom} from 'rxjs';

import {HsAddDataUrlComponent} from 'hslayers-ng/components/add-data';
import {HsAddDataVectorModule} from 'hslayers-ng/components/add-data';
import {HsConfig} from 'hslayers-ng/config';
import {HsConfigMock} from './config.service.mock';
import {HsLanguageModule} from 'hslayers-ng/components/language';
import {HsLayerUtilsService} from 'hslayers-ng/shared/utils';
import {HsLayoutService} from 'hslayers-ng/shared/layout';
import {HsLayoutServiceMock} from './layout.service.mock';
import {HsMapService} from 'hslayers-ng/shared/map';
import {HsMapServiceMock} from './map.service.mock';
import {HsUrlArcGisModule} from 'hslayers-ng/components/add-data';
import {HsUrlGeoSparqlModule} from 'hslayers-ng/components/add-data';
import {HsUrlWfsModule} from 'hslayers-ng/components/add-data';
import {HsUrlWmsModule} from 'hslayers-ng/components/add-data';
import {HsUrlWmtsModule} from 'hslayers-ng/components/add-data';
import {HsUtilsService} from 'hslayers-ng/shared/utils';
import {HsUtilsServiceMock} from './utils.service.mock';
import {HsWmsGetCapabilitiesService} from 'hslayers-ng/shared/get-capabilities';
import {mockLayerUtilsService} from './layer-utils.service.mock';
import {testingServiceEndpoints} from './data/service-endpoints';

let httpClient;
let hsWmsGetCapabilitiesService;

describe('HsAddDataUrlComponent', () => {
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

  let component: HsAddDataUrlComponent;
  let fixture: ComponentFixture<HsAddDataUrlComponent>;
  let originalTimeout: number;
  beforeEach(() => {
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;
    const mockedConfig = new HsConfigMock();

    const bed = TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      declarations: [HsAddDataUrlComponent],
      imports: [
        HttpClientModule,
        CommonModule,
        FormsModule,
        HsLanguageModule,
        HsAddDataVectorModule,
        HsUrlArcGisModule,
        HsUrlGeoSparqlModule,
        HsUrlWfsModule,
        HsUrlWmsModule,
        HsUrlWmtsModule,
      ],
      providers: [
        {provide: HsMapService, useValue: new HsMapServiceMock()},
        {provide: HsConfig, useValue: mockedConfig},
        {provide: HsUtilsService, useValue: new HsUtilsServiceMock()},
        {
          provide: HsLayoutService,
          useValue: new HsLayoutServiceMock(mockedConfig),
        },
        {provide: HsLayerUtilsService, useValue: mockLayerUtilsService()},
      ],
    });
    hsWmsGetCapabilitiesService = TestBed.inject(HsWmsGetCapabilitiesService);
    httpClient = TestBed.inject(HttpClient);
    //Mock server response
    hsWmsGetCapabilitiesService.request = async (url) => {
      const serviceURL = url.includes('?')
        ? url.substring(0, url.indexOf('?'))
        : url;
      const r = await lastValueFrom(
        httpClient.get(serviceURL + '?service=WMS&request=getCapabilities', {
          responseType: 'text',
        }),
      );
      const wrap = {response: r};
      return wrap;
    };
    //bed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HsAddDataUrlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  //

  it('Should list WMS capability layers', async () => {
    component.hsAddDataCommonService.hsAddDataService.selectType('url');

    await component.hsAddDataOwsService.connectToOWS({
      type: 'wms',
      uri: testingServiceEndpoints.wms[1],
      layer: 'GR_ZM100',
      layerOptions: {style: undefined},
    });
    const wmsService = component.hsAddDataOwsService.hsUrlWmsService;
    expect(wmsService.data.layers.length).toBe(1);
  });

  it('Should load dataset metadata record as service', async () => {
    await component.hsAddDataOwsService.connectToOWS({
      type: 'wms',
      uri: testingServiceEndpoints.wms[1],
      layer: 'Random non existent name',
      layerOptions: {style: undefined},
    });
    expect(
      component.hsAddDataCommonService.hsAddDataService.datasetSelected.getValue(),
    ).toBe('url');
  });
});
