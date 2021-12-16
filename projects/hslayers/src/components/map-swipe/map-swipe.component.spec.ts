import {CommonModule} from '@angular/common';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';

import {DragDropModule} from '@angular/cdk/drag-drop';
import {TranslateModule} from '@ngx-translate/core';

import {HsLanguageService} from '../language/language.service';
import {HsLayerShiftingService} from '../../common/layer-shifting/layer-shifting.service';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsLayoutServiceMock} from '../layout/layout.service.mock';
import {HsMapSwipeComponent} from './map-swipe.component';
import {HsMapSwipeService} from './map-swipe.service';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';
import {HsSidebarService} from '../sidebar/sidebar.service';
import {mockHsLayerShiftingService} from '../../common/layer-shifting/layer-shifting.service.mock';
import {mockHsMapSwipeService} from './map-swipe.service.mock';
import {mockLayerUtilsService} from '../utils/layer-utils.service.mock';

const mockLanguageService = jasmine.createSpyObj('HsLanguageService', [
  'getTranslation',
  'getTranslationIgnoreNonExisting',
]);

describe('HsMapSwipeComponent', () => {
  let component: HsMapSwipeComponent;
  let fixture: ComponentFixture<HsMapSwipeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HsMapSwipeComponent],
      imports: [
        HsPanelHelpersModule,
        TranslateModule.forRoot(),
        FormsModule,
        DragDropModule,
        CommonModule,
      ],
      providers: [
        {provide: HsLayoutService, useValue: new HsLayoutServiceMock()},
        {provide: HsSidebarService, useValue: {buttons: []}},
        {provide: HsLanguageService, useValue: mockLanguageService},
        {provide: HsMapSwipeService, useValue: mockHsMapSwipeService()},
        {provide: HsLayerUtilsService, useValue: mockLayerUtilsService()},
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
