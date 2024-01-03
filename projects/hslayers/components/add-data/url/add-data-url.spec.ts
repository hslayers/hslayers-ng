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

import serviceEndpoints from '../../../../test/data/service-endpoints.json';
import {HsAddDataUrlComponent} from './add-data-url.component';
import {HsAddDataVectorModule} from '../vector/vector.module';
import {HsConfig} from 'hslayers-ng/config';
import {HsConfigMock} from 'hslayers-ng/config';
import {HsLanguageModule} from 'hslayers-ng/components/language';
import {HsLayerUtilsService} from 'hslayers-ng/shared/utils';
import {HsLayoutService} from 'hslayers-ng/components/layout';
import {HsLayoutServiceMock} from 'hslayers-ng/components/layout';
import {HsMapService, HsMapServiceMock} from 'hslayers-ng/components/map';
import {HsUrlArcGisModule} from './arcgis/arcgis.module';
import {HsUrlGeoSparqlModule} from './geosparql/geosparql.module';
import {HsUrlWfsModule} from './wfs/wfs.module';
import {HsUrlWmsModule} from './wms/wms.module';
import {HsUrlWmtsModule} from './wmts/wmts.module';
import {HsUtilsService} from 'hslayers-ng/shared/utils';
import {
  HsUtilsServiceMock,
  mockLayerUtilsService,
} from 'hslayers-ng/shared/utils';
import {HsWmsGetCapabilitiesService} from 'hslayers-ng/shared/get-capabilities';

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
      uri: serviceEndpoints.wms[1],
      layer: 'GR_ZM100',
      layerOptions: {style: undefined},
    });
    const wmsService = component.hsAddDataOwsService.hsUrlWmsService;
    expect(wmsService.data.layers.length).toBe(1);
  });

  it('Should load dataset metadata record as service', async () => {
    await component.hsAddDataOwsService.connectToOWS({
      type: 'wms',
      uri: serviceEndpoints.wms[1],
      layer: 'Random non existent name',
      layerOptions: {style: undefined},
    });
    expect(
      component.hsAddDataCommonService.hsAddDataService.datasetSelected.getValue(),
    ).toBe('url');
  });
});
