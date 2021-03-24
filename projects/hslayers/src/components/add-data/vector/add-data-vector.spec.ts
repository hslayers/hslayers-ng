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
import {HsAddDataVectorComponent} from './add-data-vector.component';
import {HsCommonEndpointsService} from '../../../common/endpoints/endpoints.service';
import {HsCommonLaymanService} from '../../../common/layman/layman.service';
import {HsConfig} from '../../../config.service';
import {HsLayerUtilsService} from '../../utils/layer-utils.service';
import {HsLayoutService} from '../../layout/layout.service';
import {HsMapService} from '../../map/map.service';
import {HsMapServiceMock} from '../../map/map.service.mock';
import {HsUtilsService} from '../../utils/utils.service';
import {HsUtilsServiceMock} from '../../utils/utils.service.mock';
import {HttpClientModule} from '@angular/common/http';
import {Layer} from 'ol/layer';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {Subject} from 'rxjs';
import {TranslateModule} from '@ngx-translate/core';
import {getTitle} from '../../../common/layer-extensions';
class emptyMock {
  constructor() {}
}

class HsConfigMock {
  constructor() {}
}

class HsCommonLaymanServiceMock {
  constructor() {}
  authChange: Subject<any> = new Subject();
}

class CommonEndpointsServiceMock {
  constructor() {}
  endpointsFilled: Subject<any> = new Subject();
  endpoints = [];
}

let mockedMapService;

describe('add-layers-vector', () => {
  let component: HsAddDataVectorComponent;
  let fixture: ComponentFixture<HsAddDataVectorComponent>;

  beforeAll(() => {
    TestBed.resetTestEnvironment();
    TestBed.initTestEnvironment(
      BrowserDynamicTestingModule,
      platformBrowserDynamicTesting()
    );
  });

  beforeEach(() => {
    mockedMapService = new HsMapServiceMock();
    const mockedUtilsService: any = new HsUtilsServiceMock();
    const bed = TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [
        CommonModule,
        HttpClientModule,
        FormsModule,
        TranslateModule.forRoot(),
        NgbModule,
      ],
      declarations: [HsAddDataVectorComponent],
      providers: [
        {provide: HsMapService, useValue: mockedMapService},
        {provide: HsUtilsService, useValue: mockedUtilsService},
        {provide: HsConfig, useValue: new HsConfigMock()},
        {
          provide: HsLayoutService,
          useValue: {
            contentWrapper: document.createElement('div'),
            setMainPanel: function () {
              ///
            },
          },
        },
        {
          provide: HsCommonLaymanService,
          useValue: new HsCommonLaymanServiceMock(),
        },
        {provide: HsLayerUtilsService, useValue: new emptyMock()},
        {
          provide: HsCommonEndpointsService,
          useValue: new CommonEndpointsServiceMock(),
        },
      ],
    });
  });

  beforeEach(() => {
    spyOn(window.console, 'error');
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HsAddDataVectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  const viewChild = jasmine.createSpyObj('vectorFileInput', ['nativeElement']);

  it('GeoJSON layer should be added', async () => {
    component.vectorFileInput = viewChild;
    component.url =
      'http://data-lakecountyil.opendata.arcgis.com/datasets/cd63911cc52841f38b289aeeeff0f300_1.geojson';
    component.title = 'Cancer rates';
    component.abstract =
      'Lake County, Illinois — Layers in this service includes: Birth, ';
    component.srs = '';
    component.extract_styles = false;

    const layer: Layer = await component.add();
    expect(layer).toBeDefined();
    expect(getTitle(layer)).toEqual('Cancer rates');
  });
});
