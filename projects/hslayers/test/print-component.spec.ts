import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';
import {provideHttpClientTesting} from '@angular/common/http/testing';

import {ColorSketchModule} from 'ngx-color/sketch';
import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';
import {TranslatePipe} from '@ngx-translate/core';

import {HsConfig} from 'hslayers-ng/config';
import {HsConfigMock} from './config.service.mock';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsEventBusServiceMock} from './event-bus.service.mock';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {HsLayoutServiceMock} from './layout.service.mock';
import {
  HsPanelHeaderComponent,
  HsPanelHelpersModule,
} from 'hslayers-ng/common/panels';
import {
  HsPrintComponent,
  HsPrintImprintStylerComponent,
  HsPrintLegendService,
  HsPrintLegendStylerComponent,
  HsPrintScaleService,
  HsPrintScaleStylerComponent,
  HsPrintService,
  HsPrintTextStylerComponent,
} from 'hslayers-ng/components/print';
import {HsPrintLegendServiceMock} from './print-legend.service.mock';
import {HsSidebarService} from 'hslayers-ng/services/sidebar';
import {mockHsPrintScaleService} from './print-scale.service.mock';
import {mockHsPrintService} from './print.service.mock';

describe('HsPrintComponent', () => {
  let component: HsPrintComponent;
  let fixture: ComponentFixture<HsPrintComponent>;
  let service: HsPrintService;
  beforeEach(async () => {
    

    await TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      declarations: [HsPrintComponent],
      imports: [
        CommonModule,
        FormsModule,
        HsPrintTextStylerComponent,
        HsPrintScaleStylerComponent,
        HsPrintLegendStylerComponent,
        HsPrintImprintStylerComponent,
        HsPanelHelpersModule,
        HsPanelHeaderComponent,
        TranslatePipe,
        ColorSketchModule,
        NgbDropdownModule,
      ],
      providers: [
        {
          provide: HsLayoutService,
          useClass: HsLayoutServiceMock,
        },
        {
          provide: HsSidebarService,
          useValue: {
            buttons: [],
            addButton: () => {
              return true;
            },
          },
        },
        {provide: HsPrintService, useValue: mockHsPrintService()},
        {
          provide: HsPrintScaleService,
          useValue: mockHsPrintScaleService(),
        },
        {
          provide: HsPrintLegendService,
          useValue: new HsPrintLegendServiceMock(),
        },
        {provide: HsConfig, useClass: HsConfigMock},
        {provide: HsEventBusService, useValue: new HsEventBusServiceMock()},
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HsPrintComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    service = TestBed.inject(HsPrintService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('print layout is created', async () => {
    await component.printLayout(true);
    expect(service.print).toHaveBeenCalled();
  });

  it('print layout is downloaded as image', async () => {
    // create spy object with a click() method
    const spyObj = jasmine.createSpyObj('a', ['click']);
    // spy on document.createElement() and return the spy object
    spyOn(document, 'createElement').and.returnValue(spyObj);
    spyOn(document['body'], 'appendChild');
    await component.download();
    expect(service.download).toHaveBeenCalled();
  });
});
