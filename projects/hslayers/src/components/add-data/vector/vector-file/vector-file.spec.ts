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
import {HsAddDataVectorService} from '../vector.service';
import {HsCommonEndpointsService} from '../../../../common/endpoints/endpoints.service';
import {HsCommonLaymanService} from '../../../../common/layman/layman.service';
import {HsConfig} from '../../../../config.service';
import {HsConfigMock} from '../../../../config.service.mock';
import {HsEndpoint} from '../../../../common/endpoints/endpoint.interface';
import {HsLanguageModule} from '../../../language/language.module';
import {HsLayerUtilsService} from '../../../utils/layer-utils.service';
import {HsLayoutService} from '../../../layout/layout.service';
import {HsLayoutServiceMock} from '../../../layout/layout.service.mock';
import {HsMapService} from '../../../map/map.service';
import {HsMapServiceMock} from '../../../map/map.service.mock';
import {HsUploadComponent} from '../../../../common/upload/upload.component';
import {HsUtilsService} from '../../../utils/utils.service';
import {HsUtilsServiceMock} from '../../../utils/utils.service.mock';
import {getTitle} from '../../../../common/layer-extensions';
import {mockLayerUtilsService} from '../../../utils/layer-utils.service.mock';

class HsCommonLaymanServiceMock {
  constructor() {}
  authChange: Subject<any> = new Subject();
}

class CommonEndpointsServiceMock {
  constructor() {}
  endpointsFilled: Subject<{endpoints: HsEndpoint[]; }> =
    new Subject();
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
      }
    );
  });

  beforeEach(() => {
    mockedMapService = new HsMapServiceMock();
    const mockedUtilsService: any = new HsUtilsServiceMock();
    const bed = TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [
        CommonModule,
        HttpClientTestingModule,
        FormsModule,
        HsLanguageModule,
        NgbDropdownModule,
      ],
      declarations: [HsAddDataVectorFileComponent, HsUploadComponent],
      providers: [
        HsAddDataVectorService,
        {provide: HsMapService, useValue: mockedMapService},
        {provide: HsUtilsService, useValue: mockedUtilsService},
        {provide: HsConfig, useValue: new HsConfigMock()},
        {
          provide: HsLayoutService,
          useValue: new HsLayoutServiceMock(),
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
    fixture.componentInstance.app = 'default';
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

    const response = await service.addNewLayer(component.data, 'default');
    expect(response.layer).toBeDefined();
    expect(getTitle(response.layer)).toEqual('Cancer rates');
  });
});
