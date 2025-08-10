'use strict';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import {CUSTOM_ELEMENTS_SCHEMA, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {provideTranslateService, TranslatePipe} from '@ngx-translate/core';
import {provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';
import {provideHttpClientTesting} from '@angular/common/http/testing';

import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';

import {HsAddDataVectorFileComponent} from 'hslayers-ng/components/add-data';
import {HsAddDataVectorService} from 'hslayers-ng/services/add-data';
import {HsCommonEndpointsService} from 'hslayers-ng/services/endpoints';
import {HsCommonLaymanService} from 'hslayers-ng/common/layman';
import {HsConfig} from 'hslayers-ng/config';
import {HsConfigMock} from './config.service.mock';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {HsLayoutServiceMock} from './layout.service.mock';
import {HsMapService} from 'hslayers-ng/services/map';
import {HsMapServiceMock} from './map.service.mock';
import {HsUploadComponent} from 'hslayers-ng/common/upload';
import {getTitle} from 'hslayers-ng/common/extensions';
import {createMockLaymanService} from './common/layman/layman.service.mock';

class CommonEndpointsServiceMock {
  constructor() {}
  endpoints = signal([]);
}

let mockedMapService;

describe('add-layers-vector', () => {
  let component: HsAddDataVectorFileComponent;
  let fixture: ComponentFixture<HsAddDataVectorFileComponent>;
  let service: HsAddDataVectorService;
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
    const mockedConfig = new HsConfigMock();

    mockedMapService = new HsMapServiceMock();
    TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      declarations: [HsAddDataVectorFileComponent, HsUploadComponent],
      imports: [CommonModule, FormsModule, NgbDropdownModule, TranslatePipe],
      providers: [
        HsAddDataVectorService,
        {provide: HsMapService, useValue: mockedMapService},
        {provide: HsConfig, useValue: mockedConfig},
        {
          provide: HsLayoutService,
          useValue: new HsLayoutServiceMock(),
        },
        {
          provide: HsCommonLaymanService,
          useValue: createMockLaymanService(),
        },
        {
          provide: HsCommonEndpointsService,
          useValue: new CommonEndpointsServiceMock(),
        },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        provideTranslateService(),
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    service = TestBed.inject(HsAddDataVectorService);
    fixture = TestBed.createComponent(HsAddDataVectorFileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('GeoJSON layer should be added', async () => {
    spyOn(component.hsUploadComponent, 'getFileInput');
    component.fileType = 'geojson';
    component.data.url =
      'http://data-lakecountyil.opendata.arcgis.com/datasets/cd63911cc52841f38b289aeeeff0f300_1.geojson';
    component.data.title = 'Cancer rates';
    component.data.abstract =
      'Lake County, Illinois — Layers in this service includes: Birth, ';
    component.data.srs = '';
    component.data.extract_styles = false;

    const response = await service.addNewLayer(component.data);
    expect(response.layer).toBeDefined();
    expect(getTitle(response.layer)).toEqual('Cancer rates');
  });
});
