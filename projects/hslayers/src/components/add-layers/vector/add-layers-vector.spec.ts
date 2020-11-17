/* eslint-disable prefer-arrow-callback */
/* eslint-disable angular/no-service-method */
/* eslint-disable angular/di */
'use strict';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {HsAddLayersVectorComponent} from './add-layers-vector.component';
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
import {TranslateModule} from '@ngx-translate/core';
class emptyMock {
  constructor() {}
}

class HsConfigMock {
  constructor() {}
}

let mockedMapService;

describe('add-layers-vector', () => {
  let component: HsAddLayersVectorComponent;
  let fixture: ComponentFixture<HsAddLayersVectorComponent>;

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
      declarations: [HsAddLayersVectorComponent],
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
        {provide: HsLayerUtilsService, useValue: new emptyMock()},
      ],
    });
  });

  beforeEach(() => {
    spyOn(window.console, 'error');
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HsAddLayersVectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('GeoJSON layer should be added', async () => {
    component.url =
      'http://data-lakecountyil.opendata.arcgis.com/datasets/cd63911cc52841f38b289aeeeff0f300_1.geojson';
    component.title = 'Cancer rates';
    component.abstract =
      'Lake County, Illinois — Layers in this service includes: Birth, ';
    component.srs = '';
    component.extract_styles = false;

    const layer: Layer = await component.add();
    expect(layer).toBeDefined();
    expect(layer.get('title')).toEqual('Cancer rates');
  });
});
