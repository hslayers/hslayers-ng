import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {HttpClientTestingModule} from '@angular/common/http/testing';

import {ColorSketchModule} from 'ngx-color/sketch';
import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';

import {HsConfig} from '../../config.service';
import {HsConfigMock} from '../../config.service.mock';
import {HsEventBusService} from '../core/event-bus.service';
import {HsEventBusServiceMock} from '../core/event-bus.service.mock';
import {HsLayoutService} from '../layout/layout.service';
import {HsLayoutServiceMock} from '../layout/layout.service.mock';
import {HsPanelHeaderComponent} from '../layout/panels/panel-header/panel-header.component';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';
import {HsPrintComponent} from './print.component';
import {HsPrintImprintStylerComponent} from './imprint-styler/imprint-styler.component';
import {HsPrintLegendService} from './print-legend.service';
import {HsPrintLegendServiceMock} from './mocks/print-legend.service.mock';
import {HsPrintLegendStylerComponent} from './legend-styler/legend-styler.component';
import {HsPrintScaleService} from './print-scale.service';
import {HsPrintScaleStylerComponent} from './scale-styler/scale-styler.component';
import {HsPrintService} from './print.service';
import {HsPrintTextStylerComponent} from './text-styler/text-styler.component';
import {HsSidebarService} from '../sidebar/sidebar.service';
import {HsUtilsService} from '../utils/utils.service';
import {HsUtilsServiceMock} from '../utils/utils.service.mock';
import {TranslateCustomPipe} from '../language/translate-custom.pipe';
import {mockHsPrintScaleService} from './mocks/print-scale.service.mock';
import {mockHsPrintService} from './mocks/print.service.mock';

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
        HsPanelHeaderComponent,
        TranslateCustomPipe,
        ColorSketchModule,
        NgbDropdownModule,
        HttpClientTestingModule,
      ],
      providers: [
        {provide: HsLayoutService, useValue: new HsLayoutServiceMock()},
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
        {provide: HsConfig, useValue: new HsConfigMock()},
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
