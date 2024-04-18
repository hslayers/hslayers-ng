import {TestBed} from '@angular/core/testing';
import {of} from 'rxjs';

import {HsConfig} from 'hslayers-ng/config';
import {HsConfigMock} from './config.service.mock';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsEventBusServiceMock} from './event-bus.service.mock';
import {HsLayerEditorService} from 'hslayers-ng/components/layer-manager';
import {HsLayerManagerService} from 'hslayers-ng/services/layer-manager';
import {HsLayerShiftingService} from 'hslayers-ng/services/layer-shifting';
import {HsMapService} from 'hslayers-ng/services/map';
import {HsMapServiceMock} from './map.service.mock';
import {HsMapSwipeService} from 'hslayers-ng/components/map-swipe';
import {HsShareUrlService} from 'hslayers-ng/components/share';
import {HsToastService} from 'hslayers-ng/common/toast';

class HsToastServiceMock {
  constructor() {}
  createToastPopupMessage() {
    return true;
  }
}

jasmine.createSpyObj('HsLayerShiftingService', [
  'fillLayers',
  'moveTo',
  'getMaxZ',
  'getMinZ',
  'moveToBottom',
  'moveToTop',
  'swapSibling',
  'get',
]);

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
