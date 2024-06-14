import {CommonModule} from '@angular/common';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {FormsModule} from '@angular/forms';
import {provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';
import {provideHttpClientTesting} from '@angular/common/http/testing';

import {HsConfig} from 'hslayers-ng/config';
import {HsConfigMock} from './config.service.mock';
import {HsLayerShiftingService} from 'hslayers-ng/services/layer-shifting';
import {HsLayerUtilsService} from 'hslayers-ng/services/utils';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {HsLayoutServiceMock} from './layout.service.mock';
import {HsMapSwipeComponent} from 'hslayers-ng/components/map-swipe';
import {HsMapSwipeService} from 'hslayers-ng/components/map-swipe';
import {HsPanelHeaderComponent} from 'hslayers-ng/common/panels';
import {HsPanelHelpersModule} from 'hslayers-ng/common/panels';
import {HsSidebarService} from 'hslayers-ng/services/sidebar';
import {HsUtilsService} from 'hslayers-ng/services/utils';
import {HsUtilsServiceMock} from './utils.service.mock';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';
import {mockLayerUtilsService} from './layer-utils.service.mock';

function mockHsLayerShiftingService() {
  return jasmine.createSpyObj('HsLayerShiftingService', [
    'fillLayers',
    'moveTo',
    'getMaxZ',
    'getMinZ',
    'moveToBottom',
    'moveToTop',
    'swapSibling',
    'get',
  ]);
}

describe('HsMapSwipeComponent', () => {
  let component: HsMapSwipeComponent;
  let fixture: ComponentFixture<HsMapSwipeComponent>;

  beforeEach(async () => {
    const mockedConfig = new HsConfigMock();

    await TestBed.configureTestingModule({
      declarations: [HsMapSwipeComponent],
      imports: [
        HsPanelHelpersModule,
        HsPanelHeaderComponent,
        TranslateCustomPipe,
        FormsModule,
        DragDropModule,
        CommonModule,
      ],
      providers: [
        HsMapSwipeService,
        {provide: HsConfig, useValue: mockedConfig},
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
        {provide: HsLayerUtilsService, useValue: mockLayerUtilsService()},
        {provide: HsUtilsService, useValue: new HsUtilsServiceMock()},
        {
          provide: HsLayerShiftingService,
          useValue: mockHsLayerShiftingService(),
        },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
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
