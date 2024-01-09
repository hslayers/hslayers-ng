import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';

import {CustomTranslationService} from 'hslayers-ng/shared/language';
import {HsConfig} from 'hslayers-ng/config';
import {HsConfigMock} from './config.service.mock';
import {HsLayerUtilsService} from 'hslayers-ng/shared/utils';
import {HsPanelConstructorService} from 'hslayers-ng/shared/panels';
import {HsUtilsService} from 'hslayers-ng/shared/utils';
import {HsUtilsServiceMock} from './utils.service.mock';
import {HslayersComponent} from 'hslayers-ng';
import {TranslateTestingModule} from 'hslayers-ng/components/language';
import {mockLayerUtilsService} from './layer-utils.service.mock';

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
        HsPanelConstructorService,
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
