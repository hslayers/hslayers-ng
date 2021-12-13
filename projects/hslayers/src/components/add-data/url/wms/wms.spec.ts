import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {HttpClient, HttpClientModule} from '@angular/common/http';
import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';
import {TranslateModule} from '@ngx-translate/core';

import serviceEndpoints from '../../../../../test/data/service-endpoints.json';
import {HsCommonEndpointsService} from '../../../../common/endpoints/endpoints.service';
import {HsConfig} from '../../../../config.service';
import {HsGetCapabilitiesModule} from '../../../../common/get-capabilities/get-capabilities.module';
import {HsLayerUtilsService} from '../../../utils/layer-utils.service';
import {HsMapService} from '../../../map/map.service';
import {HsMapServiceMock} from '../../../map/map.service.mock';
import {HsPanelHelpersModule} from '../../../layout/panels/panel-helpers.module';
import {HsUrlWmsComponent} from './wms.component';
import {HsUrlWmsService} from './wms.service';
import {HsUtilsService} from '../../../utils/utils.service';
import {HsUtilsServiceMock} from '../../../utils/utils.service.mock';
import {HsWmsGetCapabilitiesService} from '../../../../common/get-capabilities/wms-get-capabilities.service';
import {mockLayerUtilsService} from '../../../utils/layer-utils.service.mock';

class EmptyMock {
  constructor() {}
}

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
      }
    );
  });

  beforeEach(() => {
    //It is possible to change timeout interval for async tests (using 'done' argument)
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;

    TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [
        CommonModule,
        HsGetCapabilitiesModule,
        HsPanelHelpersModule,
        HttpClientModule,
        FormsModule,
        TranslateModule.forRoot(),
        NgbDropdownModule,
      ],
      declarations: [HsUrlWmsComponent],
      providers: [
        HsUrlWmsService,
        {
          provide: HsConfig,
          useValue: EmptyMock,
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
      ],
    });
    hsWmsGetCapabilitiesService = TestBed.inject(HsWmsGetCapabilitiesService);
    httpClient = TestBed.inject(HttpClient);
    //Mock server response
    hsWmsGetCapabilitiesService.requestGetCapabilities = async (url) => {
      const serviceURUL = url.includes('?')
        ? url.substring(0, url.indexOf('?'))
        : url;
      return httpClient
        .get(serviceURUL + '?service=WMS&request=getCapabilities', {
          responseType: 'text',
        })
        .toPromise();
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

  serviceEndpoints.wms.forEach((url, index) => {
    (function (url, index) {
      it(`should parse capabilities ${index}`, (done) => {
        hsWmsGetCapabilitiesService
          .requestGetCapabilities(url)
          .then((capabilities) => {
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
