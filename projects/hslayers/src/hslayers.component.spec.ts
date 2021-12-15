import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {HsConfig} from './config.service';
import {HsUtilsService} from './components/utils/utils.service';
import {HsUtilsServiceMock} from './components/utils/utils.service.mock';
import {TranslateTestingModule} from './components/language/translate-testing.module';

import {HsLayerUtilsService} from './components/utils/layer-utils.service';
import {HslayersComponent} from './hslayers.component';
import {HttpClientModule} from '@angular/common/http';
import {Subject} from 'rxjs';
import {mockLayerUtilsService} from './components/utils/layer-utils.service.mock';

class HsConfigMock {
  reverseLayerList = true;
  configChanges?: Subject<HsConfig> = new Subject();
  panelsEnabled = {
    legend: false,
    measure: false,
    info: false,
    composition_browser: false,
    toolbar: false,
    mobile_settings: false,
    draw: false,
    datasource_selector: false,
    layermanager: false,
    feature_crossfilter: false,
    print: false,
    saveMap: false,
    language: false,
    permalink: false,
    compositionLoadingProgress: false,
    sensors: false,
    filter: false,
    search: false,
    tripPlanner: false,
    addData: false,
    mapSwipe: false,
  };
  constructor() {}
}

describe('HslayersComponent', () => {
  let component: HslayersComponent;
  let fixture: ComponentFixture<HslayersComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [HslayersComponent],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
        imports: [TranslateTestingModule, HttpClientModule],
        providers: [
          {provide: HsConfig, useValue: new HsConfigMock()},
          {provide: HsUtilsService, useValue: new HsUtilsServiceMock()},
          {provide: HsLayerUtilsService, useValue: mockLayerUtilsService},
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(HslayersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
