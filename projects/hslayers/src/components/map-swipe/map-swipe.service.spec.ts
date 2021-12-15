import {TestBed} from '@angular/core/testing';

import {HsConfig} from '../../config.service';
import {HsLayerShiftingService} from '../../common/layer-shifting/layer-shifting.service';
import {HsMapService} from '../map/map.service';
import {HsMapServiceMock} from '../map/map.service.mock';
import {HsMapSwipeService} from './map-swipe.service';
import {HsToastService} from '../layout/toast/toast.service';
import {mockHsLayerShiftingService} from '../../common/layer-shifting/layer-shifting.service.mock';

class HsConfigMock {
  componentsEnabled = {
    mapSwipe: true,
  };
  constructor() {}
}

class HsToastServiceMock {
  constructor() {}
  createToastPopupMessage() {
    return true;
  }
}

describe('HsMapSwipeService', () => {
  let service: HsMapSwipeService;

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
      ],
    });
    service = TestBed.inject(HsMapSwipeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
