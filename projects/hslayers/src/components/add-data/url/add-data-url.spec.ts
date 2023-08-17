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
import {HsConfig} from '../../../config.service';
import {HsConfigMock} from '../../../config.service.mock';
import {HsLanguageModule} from '../../language/language.module';
import {HsLayerUtilsService} from '../../utils/layer-utils.service';
import {HsLayoutService} from '../../layout/layout.service';
import {HsLayoutServiceMock} from '../../layout/layout.service.mock';
import {HsMapService} from '../../map/map.service';
import {HsMapServiceMock} from '../../map/map.service.mock';
import {HsUrlArcGisModule} from './arcgis/arcgis.module';
import {HsUrlGeoSparqlModule} from './geosparql/geosparql.module';
import {HsUrlWfsModule} from './wfs/wfs.module';
import {HsUrlWmsModule} from './wms/wms.module';
import {HsUrlWmtsModule} from './wmts/wmts.module';
import {HsUtilsService} from '../../utils/utils.service';
import {HsUtilsServiceMock} from '../../utils/utils.service.mock';
import {HsWmsGetCapabilitiesService} from '../../../common/get-capabilities/wms-get-capabilities.service';
import {mockLayerUtilsService} from '../../utils/layer-utils.service.mock';

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
        {provide: HsConfig, useValue: new HsConfigMock()},
        {provide: HsUtilsService, useValue: new HsUtilsServiceMock()},
        {provide: HsLayoutService, useValue: new HsLayoutServiceMock()},
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
