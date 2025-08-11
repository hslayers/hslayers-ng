import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {
  HttpClient,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import {provideHttpClientTesting} from '@angular/common/http/testing';
import {
  provideMissingTranslationHandler,
  provideTranslateService,
  TranslateLoader,
} from '@ngx-translate/core';

import {HsConfig} from 'hslayers-ng/config';
import {HsConfigMock} from './config.service.mock';
import {HsLogService} from 'hslayers-ng/services/log';
import {HsMapHostDirective, HslayersComponent} from 'hslayers-ng/core';
import {
  HsMissingTranslationHandler,
  HsTranslateLoader,
} from 'hslayers-ng/services/language';
import {TranslateTestingModule} from 'hslayers-ng/components/language';

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
        {provide: HsConfig, useClass: HsConfigMock},
        provideTranslateService({
          loader: {
            provide: TranslateLoader,
            useClass: HsTranslateLoader,
            deps: [HsConfig, HsLogService, HttpClient],
          },
          missingTranslationHandler: provideMissingTranslationHandler(
            HsMissingTranslationHandler,
          ),
        }),
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
