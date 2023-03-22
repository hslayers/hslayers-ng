import {CommonModule} from '@angular/common';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {FormsModule} from '@angular/forms';
import {HttpClientTestingModule} from '@angular/common/http/testing';

import {HsConfig} from '../../config.service';
import {HsConfigMock} from '../../config.service.mock';
import {HsLanguageModule} from '../language/language.module';
import {HsLayerShiftingService} from '../../common/layer-shifting/layer-shifting.service';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsLayoutServiceMock} from '../layout/layout.service.mock';
import {HsMapSwipeComponent} from './map-swipe.component';
import {HsMapSwipeService} from './map-swipe.service';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';
import {HsSidebarService} from '../sidebar/sidebar.service';
import {HsUtilsService} from '../utils/utils.service';
import {HsUtilsServiceMock} from '../utils/utils.service.mock';
import {mockHsLayerShiftingService} from '../../common/layer-shifting/layer-shifting.service.mock';
import {mockLayerUtilsService} from '../utils/layer-utils.service.mock';

describe('HsMapSwipeComponent', () => {
  let component: HsMapSwipeComponent;
  let fixture: ComponentFixture<HsMapSwipeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HsMapSwipeComponent],
      imports: [
        HsPanelHelpersModule,
        HsLanguageModule,
        HttpClientTestingModule,
        FormsModule,
        DragDropModule,
        CommonModule,
      ],
      providers: [
        HsMapSwipeService,
        {provide: HsConfig, useValue: new HsConfigMock()},
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
        {provide: HsLayerUtilsService, useValue: mockLayerUtilsService()},
        {provide: HsUtilsService, useValue: new HsUtilsServiceMock()},
        {
          provide: HsLayerShiftingService,
          useValue: mockHsLayerShiftingService(),
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HsMapSwipeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
