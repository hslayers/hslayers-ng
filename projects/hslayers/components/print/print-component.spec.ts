import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {HttpClientTestingModule} from '@angular/common/http/testing';

import {ColorSketchModule} from 'ngx-color/sketch';
import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';

import {HsConfig} from 'hslayers-ng/config';
import {HsConfigMock} from 'hslayers-ng/config';
import {HsEventBusService} from 'hslayers-ng/shared/event-bus';
import {HsEventBusServiceMock} from 'hslayers-ng/shared/event-bus';
import {HsLayoutService} from 'hslayers-ng/shared/layout';
import {HsLayoutServiceMock} from 'hslayers-ng/shared/layout';
import {HsPanelHeaderComponent} from 'hslayers-ng/common/panels';
import {HsPanelHelpersModule} from 'hslayers-ng/common/panels';
import {HsPrintComponent} from './print.component';
import {HsPrintImprintStylerComponent} from './imprint-styler/imprint-styler.component';
import {HsPrintLegendService} from './print-legend.service';
import {HsPrintLegendServiceMock} from './mocks/print-legend.service.mock';
import {HsPrintLegendStylerComponent} from './legend-styler/legend-styler.component';
import {HsPrintScaleService} from './print-scale.service';
import {HsPrintScaleStylerComponent} from './scale-styler/scale-styler.component';
import {HsPrintService} from './print.service';
import {HsPrintTextStylerComponent} from './text-styler/text-styler.component';
import {HsSidebarService} from 'hslayers-ng/components/sidebar';
import {HsUtilsService} from 'hslayers-ng/shared/utils';
import {HsUtilsServiceMock} from 'hslayers-ng/shared/utils';
import {TranslateCustomPipe} from 'hslayers-ng/shared/language';
import {mockHsPrintScaleService} from './mocks/print-scale.service.mock';
import {mockHsPrintService} from './mocks/print.service.mock';

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
