/* eslint-disable prefer-arrow-callback */
'use strict';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {HttpClientTestingModule} from '@angular/common/http/testing';

import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';
import {Subject} from 'rxjs';

import {HsAddDataVectorFileComponent} from './vector-file.component';
import {HsAddDataVectorService} from 'hslayers-ng/shared/add-data';
import {HsCommonEndpointsService} from 'hslayers-ng/shared/endpoints';
import {HsCommonLaymanService} from 'hslayers-ng/common/layman';
import {HsConfig} from 'hslayers-ng/config';
import {HsConfigMock} from 'hslayers-ng/config';
import {HsEndpoint} from 'hslayers-ng/common/types';
import {HsLayerUtilsService} from 'hslayers-ng/shared/utils';
import {HsLayoutService} from 'hslayers-ng/shared/layout';
import {HsLayoutServiceMock} from 'hslayers-ng/shared/layout';
import {HsMapService} from 'hslayers-ng/shared/map';
import {HsMapServiceMock} from 'hslayers-ng/shared/map';
import {HsUploadComponent} from 'hslayers-ng/common/upload';
import {HsUtilsService} from 'hslayers-ng/shared/utils';
import {HsUtilsServiceMock} from 'hslayers-ng/shared/utils';
import {TranslateCustomPipe} from 'hslayers-ng/shared/language';
import {getTitle} from 'hslayers-ng/common/extensions';
import {mockLayerUtilsService} from 'hslayers-ng/shared/utils';

class HsCommonLaymanServiceMock {
  constructor() {}
  authChange: Subject<any> = new Subject();
}

class CommonEndpointsServiceMock {
  constructor() {}
  endpointsFilled: Subject<HsEndpoint[]> = new Subject();
  endpoints = [];
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
    const mockedUtilsService: any = new HsUtilsServiceMock();
    const bed = TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [
        CommonModule,
        HttpClientTestingModule,
        FormsModule,
        NgbDropdownModule,
        TranslateCustomPipe,
      ],
      declarations: [HsAddDataVectorFileComponent, HsUploadComponent],
      providers: [
        HsAddDataVectorService,
        {provide: HsMapService, useValue: mockedMapService},
        {provide: HsUtilsService, useValue: mockedUtilsService},
        {provide: HsConfig, useValue: mockedConfig},
        {
          provide: HsLayoutService,
          useValue: new HsLayoutServiceMock(mockedConfig),
        },
        {
          provide: HsCommonLaymanService,
          useValue: new HsCommonLaymanServiceMock(),
        },
        {provide: HsLayerUtilsService, useValue: mockLayerUtilsService()},
        {
          provide: HsCommonEndpointsService,
          useValue: new CommonEndpointsServiceMock(),
        },
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
