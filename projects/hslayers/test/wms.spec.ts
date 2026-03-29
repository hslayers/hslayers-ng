import {CUSTOM_ELEMENTS_SCHEMA, signal} from '@angular/core';
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
import {provideTranslateService} from '@ngx-translate/core';

import {HsCommonEndpointsService} from 'hslayers-ng/services/endpoints';
import {HsConfig} from 'hslayers-ng/config';
import {HsConfigMock} from './config.service.mock';
import {HsMapService} from 'hslayers-ng/services/map';
import {HsMapServiceMock} from './map.service.mock';
import {HsPanelContainerComponent} from 'hslayers-ng/common/panels';
import {HsUrlWmsComponent} from 'hslayers-ng/components/add-data';
import {HsUrlWmsService} from 'hslayers-ng/services/add-data';
import {testingServiceEndpoints} from './data/service-endpoints';

class HsCommonEndpointsServiceMock {
  constructor() {}

  endpoints = signal([]);
}

let httpClient;

describe('add-data-url', () => {
  let component: HsUrlWmsComponent;
  let fixture: ComponentFixture<HsUrlWmsComponent>;
  let originalTimeout: number;
  beforeEach(() => {
    //It is possible to change timeout interval for async tests (using 'done' argument)
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;

    TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [
        CommonModule,
        HsPanelContainerComponent,
        FormsModule,
        NgbDropdownModule,
        HsUrlWmsComponent,
      ],
      providers: [
        HsUrlWmsService,
        {
          provide: HsConfig,
          useClass: HsConfigMock,
        },
        {
          provide: HsCommonEndpointsService,
          useValue: new HsCommonEndpointsServiceMock(),
        },
        {provide: HsMapService, useValue: new HsMapServiceMock()},
        provideHttpClient(withInterceptorsFromDi()),
        provideTranslateService(),
      ],
    });
    httpClient = TestBed.inject(HttpClient);
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
        if (url == 'https://watlas.lesprojekt.cz/geoserver/layman_wms/ows') {
          return done();
        }
        const serviceURL = url.includes('?')
          ? url.substring(0, url.indexOf('?'))
          : url;
        lastValueFrom(
          httpClient.get(serviceURL + '?service=WMS&request=getCapabilities', {
            responseType: 'text',
          }),
        )
          .then((response) =>
            component.hsUrlWmsService.capabilitiesReceived(response, ''),
          )
          .then(() => {
            expect(component.hsUrlWmsService.data.srss).toBeDefined();
            done();
          })
          .catch((e) => {
            done.fail(e);
          });
      });
    })(url, index);
  });
});
