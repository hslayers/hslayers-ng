import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import {TranslateModule} from '@ngx-translate/core';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {HttpClient, HttpClientModule} from '@angular/common/http';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';

import {HsCommonEndpointsService} from '../../../../common/endpoints/endpoints.service';
import {HsConfig} from '../../../../config.service';
import {HsMapServiceMock} from '../../../map/map.service.mock';
import {HsPanelHelpersModule} from '../../../layout/panels/panel-helpers.module';
import {HsUtilsServiceMock} from '../../../utils/utils.service.mock';
import {HsAddDataWmsComponent} from './add-data-url-wms.component';
import {HsAddDataUrlWmsService} from './add-data-url-wms.service';
import {HsGetCapabilitiesModule} from '../../../../common/get-capabilities/get-capabilities.module';
import {HsUtilsService} from '../../../utils/utils.service';
import {HsWmsGetCapabilitiesService} from '../../../../common/wms/get-capabilities.service';

class EmptyMock {
  constructor() {}
}

let httpClient;
let hsWmsGetCapabilitiesService;
describe('add-data-url', () => {
  let component: HsAddDataWmsComponent;
  let fixture: ComponentFixture<HsAddDataWmsComponent>;

  beforeAll(() => {
    TestBed.resetTestEnvironment();
    TestBed.initTestEnvironment(
      BrowserDynamicTestingModule,
      platformBrowserDynamicTesting()
    );
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [
        CommonModule,
        HsGetCapabilitiesModule,
        HsPanelHelpersModule,
        HttpClientModule,
        FormsModule,
        TranslateModule.forRoot(),
        NgbModule,
      ],
      declarations: [HsAddDataWmsComponent],
      providers: [
        HsAddDataUrlWmsService,
        {
          provide: HsConfig,
          useValue: EmptyMock
        },
        {
          provide: HsUtilsService,
          useValue: HsUtilsServiceMock
        },
        {
          provide: HsCommonEndpointsService,
          useValue: EmptyMock
        }
      ],
    });
    hsWmsGetCapabilitiesService = TestBed.inject(
      HsWmsGetCapabilitiesService
    );
    httpClient = TestBed.inject(HttpClient)
    //Mock server response
    hsWmsGetCapabilitiesService.requestGetCapabilities = async(url) => {
      return httpClient.get(url, {
        responseType: 'text',
      }).toPromise();
    };
  });

  beforeEach(() => {
    spyOn(window.console, 'error');
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HsAddDataWmsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should parse capabilities 1', function () {
    const url = '../../../../../test/data/capabilities-wms/ca.nfis.org.xml';
    hsWmsGetCapabilitiesService.requestGetCapabilities(url).then((capabilities) => {
      component.HsAddDataUrlWmsService.capabilitiesReceived(capabilities, '')
    });
    expect(component.HsAddDataUrlWmsService.data.srss).toBeDefined();
  });

  it('should parse capabilities 2', function () {
    const url = '../../../../../test/data/capabilities-wms/data.geus.dk.xml';
    hsWmsGetCapabilitiesService.requestGetCapabilities(url).then((capabilities) => {
      component.HsAddDataUrlWmsService.capabilitiesReceived(capabilities, '')
    });
    expect(component.HsAddDataUrlWmsService.data.srss).toBeDefined();
  });

  it('should parse capabilities 3', function () {
    const url = '../../../../../test/data/capabilities-wms/geoportal.cuzk.cz.xml';
    hsWmsGetCapabilitiesService.requestGetCapabilities(url).then((capabilities) => {
      component.HsAddDataUrlWmsService.capabilitiesReceived(capabilities, '')
    });
    expect(component.HsAddDataUrlWmsService.data.srss).toBeDefined();
  });
});
