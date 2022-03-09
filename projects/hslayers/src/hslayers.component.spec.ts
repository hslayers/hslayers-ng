import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {HttpClient} from '@angular/common/http';
import {HttpClientTestingModule} from '@angular/common/http/testing';

import {Subject} from 'rxjs';

import {CustomTranslationService} from './components/language/custom-translate.service';
import {HsConfig} from './config.service';
import {HsConfigMock} from './config.service.mock';
import {HsLayerUtilsService} from './components/utils/layer-utils.service';
import {HsUtilsService} from './components/utils/utils.service';
import {HsUtilsServiceMock} from './components/utils/utils.service.mock';
import {HslayersComponent} from './hslayers.component';
import {TranslateTestingModule} from './components/language/translate-testing.module';
import {mockLayerUtilsService} from './components/utils/layer-utils.service.mock';

describe('HslayersComponent', () => {
  let component: HslayersComponent;
  let fixture: ComponentFixture<HslayersComponent>;
  let hsConfig;
  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [HslayersComponent],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
        imports: [TranslateTestingModule, HttpClientTestingModule],
        providers: [
          {provide: HsConfig, useValue: new HsConfigMock()},
          {provide: HsUtilsService, useValue: new HsUtilsServiceMock()},
          {provide: HsLayerUtilsService, useValue: mockLayerUtilsService},
          {
            provide: CustomTranslationService,
            useFactory: (dep1, dep2) => {
              return () => new CustomTranslationService(dep1, dep2);
            },
            deps: [HsConfig, HttpClient],
          },
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(HslayersComponent);
    hsConfig = TestBed.inject(HsConfig);
    hsConfig.get('default').reverseLayerList = true;
    hsConfig.get('default').panelsEnabled = {
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

    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
