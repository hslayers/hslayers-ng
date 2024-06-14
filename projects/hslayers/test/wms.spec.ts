import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {
  HttpClient,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';

import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';
import {lastValueFrom} from 'rxjs';

import {HsCommonEndpointsService} from 'hslayers-ng/services/endpoints';
import {HsConfig} from 'hslayers-ng/config';
import {HsConfigMock} from './config.service.mock';
import {HsLanguageModule} from 'hslayers-ng/components/language';
import {HsLayerUtilsService} from 'hslayers-ng/services/utils';
import {HsMapService} from 'hslayers-ng/services/map';
import {HsMapServiceMock} from './map.service.mock';
import {HsPanelHelpersModule} from 'hslayers-ng/common/panels';
import {HsUrlWmsComponent} from 'hslayers-ng//components/add-data';
import {HsUrlWmsService} from 'hslayers-ng/services/add-data';
import {HsUtilsService} from 'hslayers-ng/services/utils';
import {HsUtilsServiceMock} from './utils.service.mock';
import {HsWmsGetCapabilitiesService} from 'hslayers-ng/services/get-capabilities';
import {mockLayerUtilsService} from './layer-utils.service.mock';
import {testingServiceEndpoints} from './data/service-endpoints';

class HsCommonEndpointsServiceMock {
  constructor() {}

  endpoints = [];
}

let httpClient;
let hsWmsGetCapabilitiesService;
describe('add-data-url', () => {
  let component: HsUrlWmsComponent;
  let fixture: ComponentFixture<HsUrlWmsComponent>;
  let originalTimeout: number;
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

  beforeEach(() => {
    //It is possible to change timeout interval for async tests (using 'done' argument)
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;

    TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      declarations: [HsUrlWmsComponent],
      imports: [
        CommonModule,
        HsPanelHelpersModule,
        FormsModule,
        HsLanguageModule,
        NgbDropdownModule,
      ],
      providers: [
        HsUrlWmsService,
        {
          provide: HsConfig,
          useValue: new HsConfigMock(),
        },
        {
          provide: HsUtilsService,
          useValue: new HsUtilsServiceMock(),
        },
        {
          provide: HsCommonEndpointsService,
          useValue: new HsCommonEndpointsServiceMock(),
        },
        {provide: HsMapService, useValue: new HsMapServiceMock()},
        {provide: HsLayerUtilsService, useValue: mockLayerUtilsService()},
        provideHttpClient(withInterceptorsFromDi()),
      ],
    });
    hsWmsGetCapabilitiesService = TestBed.inject(HsWmsGetCapabilitiesService);
    httpClient = TestBed.inject(HttpClient);
    //Mock server response
    hsWmsGetCapabilitiesService.request = async (url) => {
      const serviceURL = url.includes('?')
        ? url.substring(0, url.indexOf('?'))
        : url;
      return lastValueFrom(
        httpClient.get(serviceURL + '?service=WMS&request=getCapabilities', {
          responseType: 'text',
        }),
      );
    };
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HsUrlWmsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  testingServiceEndpoints.wms.forEach((url, index) => {
    (function (url, index) {
      it(`should parse capabilities ${index}`, (done) => {
        if (
          url ==
          'https://hub.lesprojekt.cz/client/geoserver/viktorie_sloupova/ows'
        ) {
          return done();
        }
        hsWmsGetCapabilitiesService.request(url).then((capabilities) => {
          component.hsUrlWmsService
            .capabilitiesReceived(capabilities, '')
            .then(() => {
              expect(component.hsUrlWmsService.data.srss).toBeDefined();
              done();
            })
            .catch((e) => {
              done.fail(e);
            });
        });
      });
    })(url, index);
  });
});
