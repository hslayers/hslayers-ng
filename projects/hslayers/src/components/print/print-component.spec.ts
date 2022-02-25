import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';

import {ColorSketchModule} from 'ngx-color/sketch';
import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';
import {TranslateModule} from '@ngx-translate/core';

import {HsEventBusService} from '../core/event-bus.service';
import {HsEventBusServiceMock} from '../core/event-bus.service.mock';
import {HsLanguageService} from '../language/language.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsLayoutServiceMock} from '../layout/layout.service.mock';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';
import {HsPrintComponent} from './print.component';
import {HsPrintImprintStylerComponent} from './imprint-styler/imprint-styler.component';
import {HsPrintLegendService} from './print-legend.service';
import {HsPrintLegendStylerComponent} from './legend-styler/legend-styler.component';
import {HsPrintScaleService} from './print-scale.service';
import {HsPrintScaleStylerComponent} from './scale-styler/scale-styler.component';
import {HsPrintService} from './print.service';
import {HsPrintTextStylerComponent} from './text-styler/text-styler.component';
import {HsSidebarService} from '../sidebar/sidebar.service';
import {HsUtilsService} from '../utils/utils.service';
import {HsUtilsServiceMock} from '../utils/utils.service.mock';
import {mockHsPrintLegendService} from './mocks/print-legend.service.mock';
import {mockHsPrintScaleService} from './mocks/print-scale.service.mock';
import {mockHsPrintService} from './mocks/print.service.mock';
import {mockLanguageService} from '../language/language.service.mock';

describe('HsPrintComponent', () => {
  let component: HsPrintComponent;
  let fixture: ComponentFixture<HsPrintComponent>;
  let service: HsPrintService;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      declarations: [
        HsPrintComponent,
        HsPrintTextStylerComponent,
        HsPrintScaleStylerComponent,
        HsPrintLegendStylerComponent,
        HsPrintImprintStylerComponent,
      ],
      imports: [
        CommonModule,
        FormsModule,
        HsPanelHelpersModule,
        TranslateModule.forRoot(),
        ColorSketchModule,
        NgbDropdownModule,
      ],
      providers: [
        {provide: HsLayoutService, useValue: new HsLayoutServiceMock()},
        {provide: HsSidebarService, useValue: {buttons: []}},
        {provide: HsLanguageService, useValue: mockLanguageService()},
        {provide: HsPrintService, useValue: mockHsPrintService()},
        {
          provide: HsPrintScaleService,
          useValue: mockHsPrintScaleService(),
        },
        {
          provide: HsPrintLegendService,
          useValue: mockHsPrintLegendService(),
        },
        {provide: HsUtilsService, useValue: new HsUtilsServiceMock()},
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
