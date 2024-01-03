import {CommonModule} from '@angular/common';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {FormsModule} from '@angular/forms';
import {HttpClientTestingModule} from '@angular/common/http/testing';

import {HsConfig} from 'hslayers-ng/config';
import {HsConfigMock} from 'hslayers-ng/config';
import {
  HsLayerShiftingService,
  mockHsLayerShiftingService,
} from 'hslayers-ng/shared/layer-shifting';
import {HsLayerUtilsService} from 'hslayers-ng/shared/utils';
import {HsLayoutService} from 'hslayers-ng/components/layout';
import {HsLayoutServiceMock} from 'hslayers-ng/components/layout';
import {HsMapSwipeComponent} from './map-swipe.component';
import {HsMapSwipeService} from './map-swipe.service';
import {HsPanelHeaderComponent} from 'hslayers-ng/components/layout';
import {HsPanelHelpersModule} from 'hslayers-ng/components/layout';
import {HsSidebarService} from 'hslayers-ng/components/sidebar';
import {HsUtilsService} from 'hslayers-ng/shared/utils';
import {HsUtilsServiceMock} from 'hslayers-ng/shared/utils';
import {TranslateCustomPipe} from 'hslayers-ng/components/language';
import {mockLayerUtilsService} from 'hslayers-ng/shared/utils';

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
        HttpClientTestingModule,
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
