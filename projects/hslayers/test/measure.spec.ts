import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {TranslatePipe} from '@ngx-translate/core';
import {provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';
import {provideHttpClientTesting} from '@angular/common/http/testing';

import {HsConfig} from 'hslayers-ng/config';
import {HsConfigMock} from './config.service.mock';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {HsLayoutServiceMock} from './layout.service.mock';
import {HsMapService} from 'hslayers-ng/services/map';
import {HsMapServiceMock} from './map.service.mock';
import {
  HsMeasureComponent,
  HsMeasureService,
} from 'hslayers-ng/components/measure';

describe('HsMeasure', () => {
  beforeAll(() => {
    TestBed.resetTestEnvironment();
    TestBed.initTestEnvironment(
      BrowserDynamicTestingModule,
      platformBrowserDynamicTesting(),
      {
        teardown: {destroyAfterEach: false},
      },
    );
  });

  let fixture: ComponentFixture<HsMeasureComponent>;
  let component: HsMeasureComponent;
  let service: HsMeasureService;

  beforeEach(() => {
    

    TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      declarations: [HsMeasureComponent],
      imports: [FormsModule, TranslatePipe],
      providers: [
        HsMeasureService,
        {
          provide: HsLayoutService,
          useClass: HsLayoutServiceMock,
        },
        {provide: HsMapService, useValue: new HsMapServiceMock()},
        {provide: HsConfig, useClass: HsConfigMock},
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }); //.compileComponents();
    fixture = TestBed.createComponent(HsMeasureComponent);
    service = TestBed.inject(HsMeasureService);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
