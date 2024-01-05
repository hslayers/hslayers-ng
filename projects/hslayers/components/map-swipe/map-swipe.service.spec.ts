import {TestBed} from '@angular/core/testing';
import {of} from 'rxjs';

import {HsConfig} from 'hslayers-ng/config';
import {HsConfigMock} from 'hslayers-ng/config';
import {HsEventBusService} from 'hslayers-ng/shared/event-bus';
import {HsEventBusServiceMock} from 'hslayers-ng/shared/core';
import {HsLayerEditorService} from 'hslayers-ng/components/layer-manager';
import {HsLayerManagerService} from 'hslayers-ng/shared/layer-manager';
import {
  HsLayerShiftingService,
  mockHsLayerShiftingService,
} from 'hslayers-ng/shared/layer-shifting';
import {HsMapService} from 'hslayers-ng/shared/map';
import {HsMapServiceMock} from 'hslayers-ng/shared/map';
import {HsMapSwipeService} from './map-swipe.service';
import {HsShareUrlService} from 'hslayers-ng/components/share';
import {HsToastService} from 'hslayers-ng/common/toast';

class HsToastServiceMock {
  constructor() {}
  createToastPopupMessage() {
    return true;
  }
}

const HsLayerManagerServiceMock = {
  ...jasmine.createSpyObj('HsLayerManagerService', ['sortLayersByZ']),
};

describe('HsMapSwipeService', () => {
  let service: HsMapSwipeService;
  let hsConfig: HsConfig;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {provide: HsConfig, useValue: new HsConfigMock()},
        {provide: HsMapService, useValue: new HsMapServiceMock()},
        {provide: HsToastService, useValue: new HsToastServiceMock()},
        {
          provide: HsLayerShiftingService,
          useValue: mockHsLayerShiftingService(),
        },
        {
          provide: HsShareUrlService,
          useValue: {
            getParamValue: () => undefined,
            updateCustomParams: () => undefined,
          },
        },
        {provide: HsEventBusService, useValue: new HsEventBusServiceMock()},
        {
          provide: HsLayerManagerService,
          useValue: HsLayerManagerServiceMock,
        },
        {
          provide: HsLayerEditorService,
          useValue: {
            layerTitleChange: of({layer: undefined}),
          },
        },
      ],
    });
    hsConfig = TestBed.inject(HsConfig);
    hsConfig.componentsEnabled = {
      mapSwipe: true,
    };
    service = TestBed.inject(HsMapSwipeService);
    service.removeCompletely = () => {
      return true;
    };
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
