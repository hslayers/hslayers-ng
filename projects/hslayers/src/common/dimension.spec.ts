import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {HsDimensionService} from './dimension.service';
import {HsMapService} from '../components/map/map.service';
import {HsMapServiceMock} from '../components/map/map.service.mock';
import {HsUtilsService} from '../components/utils/utils.service';
import {HsUtilsServiceMock} from '../components/utils/utils.service.mock';
import {TestBed} from '@angular/core/testing';

describe('HsGetCapabilitiesModule', () => {
  beforeAll(() => {
    TestBed.resetTestEnvironment();
    TestBed.initTestEnvironment(
      BrowserDynamicTestingModule,
      platformBrowserDynamicTesting()
    );
  });

  let service: HsDimensionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [],
      providers: [
        HsDimensionService,
        {provide: HsMapService, useValue: new HsMapServiceMock()},
        {provide: HsUtilsService, useValue: new HsUtilsServiceMock()},
      ],
    }); //.compileComponents();
    service = TestBed.get(HsDimensionService);
  });

  it('prepareTimeSteps', () => {
    const values = service.prepareTimeSteps(
      '2016-03-16T12:00:00.000Z/2016-07-16T12:00:00.000Z/P30DT12H'
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
