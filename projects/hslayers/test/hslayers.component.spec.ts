import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {
  HttpClient,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import {provideHttpClientTesting} from '@angular/common/http/testing';
import {provideTranslateService, TranslateLoader} from '@ngx-translate/core';

import {HsConfig} from 'hslayers-ng/config';
import {HsConfigMock} from './config.service.mock';
import {HsMapHostDirective, HslayersComponent} from 'hslayers-ng/core';
import {TranslateTestingModule} from 'hslayers-ng/components/language';
import {WebpackTranslateLoader} from 'hslayers-ng/services/language';
import {HsLogService} from 'hslayers-ng/services/log';

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
        provideTranslateService({
          loader: {
            provide: TranslateLoader,
            useClass: WebpackTranslateLoader,
            deps: [HsConfig, HsLogService, HttpClient],
          },
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
