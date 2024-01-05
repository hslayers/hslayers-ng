import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {TestBed} from '@angular/core/testing';

import {HsDimensionTimeService} from './dimension-time.service';
import {HsEventBusService} from 'hslayers-ng/shared/event-bus';
import {HsEventBusServiceMock} from 'hslayers-ng/shared/core';
import {HsLayerUtilsService} from 'hslayers-ng/shared/utils';
import {HsUtilsService} from 'hslayers-ng/shared/utils';
import {HsUtilsServiceMock} from 'hslayers-ng/shared/utils';
import {mockLayerUtilsService} from 'hslayers-ng/shared/utils';

describe('HsGetCapabilitiesModule', () => {
  beforeAll(() => {
    TestBed.resetTestEnvironment();
    TestBed.initTestEnvironment(
      BrowserDynamicTestingModule,
      platformBrowserDynamicTesting(),
      {
        teardown: {destroyAfterEach: false},
      },
    );
  });

  let service: HsDimensionTimeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [],
      providers: [
        HsDimensionTimeService,
        {provide: HsEventBusService, useValue: new HsEventBusServiceMock()},
        {provide: HsUtilsService, useValue: new HsUtilsServiceMock()},
        {provide: HsLayerUtilsService, useValue: mockLayerUtilsService()},
      ],
    }); //.compileComponents();
    service = TestBed.inject(HsDimensionTimeService);
  });

  it('parseTimePoints', () => {
    const values = service.parseTimePoints(
      '2016-03-16T12:00:00.000Z/2016-07-16T12:00:00.000Z/P30DT12H',
    );
    expect(values).toBeDefined();
    expect(values).toEqual([
      '2016-03-16T12:00:00.000Z',
      '2016-04-16T00:00:00.000Z',
      '2016-05-16T12:00:00.000Z',
      '2016-06-16T00:00:00.000Z',
      '2016-07-16T12:00:00.000Z',
    ]);
  });
});
