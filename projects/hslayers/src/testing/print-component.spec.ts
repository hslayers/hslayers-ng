import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {HttpClientTestingModule} from '@angular/common/http/testing';

import {ColorSketchModule} from 'ngx-color/sketch';
import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';

import {HsConfig} from 'hslayers-ng/config';
import {HsConfigMock} from './config.service.mock';
import {HsEventBusService} from 'hslayers-ng/shared/event-bus';
import {HsEventBusServiceMock} from './event-bus.service.mock';
import {HsLayoutService} from 'hslayers-ng/shared/layout';
import {HsLayoutServiceMock} from './layout.service.mock';
import {HsPanelHeaderComponent} from 'hslayers-ng/common/panels';
import {HsPanelHelpersModule} from 'hslayers-ng/common/panels';
import {HsPrintComponent} from 'hslayers-ng/components/print';
import {HsPrintImprintStylerComponent} from 'hslayers-ng/components/print';
import {HsPrintLegendService} from 'hslayers-ng/components/print';
import {HsPrintLegendServiceMock} from './print-legend.service.mock';
import {HsPrintLegendStylerComponent} from 'hslayers-ng/components/print';
import {HsPrintScaleService} from 'hslayers-ng/components/print';
import {HsPrintScaleStylerComponent} from 'hslayers-ng/components/print';
import {HsPrintService} from 'hslayers-ng/components/print';
import {HsPrintTextStylerComponent} from 'hslayers-ng/components/print';
import {HsSidebarService} from 'hslayers-ng/shared/sidebar';
import {HsUtilsService} from 'hslayers-ng/shared/utils';
import {HsUtilsServiceMock} from './utils.service.mock';
import {TranslateCustomPipe} from 'hslayers-ng/shared/language';
import {mockHsPrintScaleService} from './print-scale.service.mock';
import {mockHsPrintService} from './print.service.mock';

describe('HsPrintComponent', () => {
  let component: HsPrintComponent;
  let fixture: ComponentFixture<HsPrintComponent>;
  let service: HsPrintService;
  beforeEach(async () => {
    const mockedConfig = new HsConfigMock();

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
        TranslateCustomPipe,
        ColorSketchModule,
        NgbDropdownModule,
        HttpClientTestingModule,
      ],
      providers: [
        {
          provide: HsLayoutService,
          useValue: new HsLayoutServiceMock(mockedConfig),
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
        {provide: HsUtilsService, useValue: new HsUtilsServiceMock()},
        {provide: HsConfig, useValue: mockedConfig},
        {provide: HsEventBusService, useValue: new HsEventBusServiceMock()},
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
