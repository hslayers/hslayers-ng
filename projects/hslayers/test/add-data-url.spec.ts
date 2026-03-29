import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {
  HttpClient,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import {lastValueFrom} from 'rxjs';
import {provideTranslateService, TranslatePipe} from '@ngx-translate/core';

import {
  HsAddDataUrlComponent,
  HsAddDataVectorUrlComponent,
  HsUrlArcGisComponent,
  HsUrlGeoSparqlComponent,
  HsUrlWfsComponent,
  HsUrlWmsComponent,
  HsUrlWmtsComponent,
} from 'hslayers-ng/components/add-data';
import {HsConfig} from 'hslayers-ng/config';
import {HsConfigMock} from './config.service.mock';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {HsLayoutServiceMock} from './layout.service.mock';
import {HsMapService} from 'hslayers-ng/services/map';
import {HsMapServiceMock} from './map.service.mock';
import {HsWmsGetCapabilitiesService} from 'hslayers-ng/services/get-capabilities';
import {testingServiceEndpoints} from './data/service-endpoints';

let httpClient;
let hsWmsGetCapabilitiesService;

describe('HsAddDataUrlComponent', () => {
  let component: HsAddDataUrlComponent;
  let fixture: ComponentFixture<HsAddDataUrlComponent>;
  let originalTimeout: number;
  beforeEach(() => {
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;

    const bed = TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [
        FormsModule,
        TranslatePipe,
        HsAddDataVectorUrlComponent,
        HsUrlArcGisComponent,
        HsUrlGeoSparqlComponent,
        HsUrlWfsComponent,
        HsUrlWmsComponent,
        HsUrlWmtsComponent,
        HsAddDataUrlComponent,
      ],
      providers: [
        {provide: HsMapService, useValue: new HsMapServiceMock()},
        {provide: HsConfig, useClass: HsConfigMock},
        {
          provide: HsLayoutService,
          useClass: HsLayoutServiceMock,
        },
        provideHttpClient(withInterceptorsFromDi()),
        provideTranslateService(),
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
