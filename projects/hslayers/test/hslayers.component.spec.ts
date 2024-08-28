import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';
import {provideHttpClientTesting} from '@angular/common/http/testing';

import {CustomTranslationService} from 'hslayers-ng/services/language';
import {HsConfig} from 'hslayers-ng/config';
import {HsConfigMock} from './config.service.mock';
import {HsLayerUtilsService} from 'hslayers-ng/services/utils';
import {HsMapHostDirective, HslayersComponent} from 'hslayers-ng/core';
import {HsUtilsService} from 'hslayers-ng/services/utils';
import {HsUtilsServiceMock} from './utils/utils.service.mock';
import {TranslateTestingModule} from 'hslayers-ng/components/language';
import {mockLayerUtilsService} from './layer-utils.service.mock';

describe('HslayersComponent', () => {
  let component: HslayersComponent;
  let fixture: ComponentFixture<HslayersComponent>;
  let hsConfig;
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [HslayersComponent, HsMapHostDirective],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [TranslateTestingModule],
      providers: [
        {provide: HsConfig, useValue: new HsConfigMock()},
        {provide: HsUtilsService, useValue: new HsUtilsServiceMock()},
        {provide: HsLayerUtilsService, useValue: mockLayerUtilsService},
        CustomTranslationService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
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
