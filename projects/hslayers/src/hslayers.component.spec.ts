import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';

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
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [HslayersComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [TranslateTestingModule, HttpClientTestingModule],
      providers: [
        {provide: HsConfig, useValue: new HsConfigMock()},
        {provide: HsUtilsService, useValue: new HsUtilsServiceMock()},
        {provide: HsLayerUtilsService, useValue: mockLayerUtilsService},
        CustomTranslationService,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    hsConfig = TestBed.inject(HsConfig);
    hsConfig.reverseLayerList = true;
    fixture = TestBed.createComponent(HslayersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
