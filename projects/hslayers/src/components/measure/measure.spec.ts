import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';

import Map from 'ol/Map';
import {LineString, Polygon} from 'ol/geom';

import {HsLayoutService} from '../layout/layout.service';
import {HsMapService} from '../map/map.service';
import {HsMapServiceMock} from '../map/map.service.mock';
import {HsMeasureComponent} from './measure.component';
import {HsMeasureService} from './measure.service';
import {HsUtilsService} from '../utils/utils.service';
import {HsUtilsServiceMock} from '../utils/utils.service.mock';

class emptyMock {
  constructor() {}
}

describe('HsMeasure', () => {
  beforeAll(() => {
    TestBed.resetTestEnvironment();
    TestBed.initTestEnvironment(
      BrowserDynamicTestingModule,
      platformBrowserDynamicTesting()
    );
  });

  let fixture: ComponentFixture<HsMeasureComponent>;
  let component: HsMeasureComponent;
  let service: HsMeasureService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [FormsModule, TranslateModule.forRoot()],
      declarations: [HsMeasureComponent],
      providers: [
        HsMeasureService,
        {provide: HsLayoutService, useValue: new emptyMock()},
        {provide: HsMapService, useValue: new HsMapServiceMock()},
        {provide: HsUtilsService, useValue: new HsUtilsServiceMock()},
      ],
    }); //.compileComponents();
    fixture = TestBed.createComponent(HsMeasureComponent);
    service = TestBed.get(HsMeasureService);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('format length measurements', () => {
    service.map = new Map();
    let measuredLine = new LineString([
      //coordinates in the Map's default projection
      [16223, 48456],
      [234, 785],
    ]);
    let measurement = service.formatLength(measuredLine);
    expect(measurement.unit).toBe('km');
    expect(measurement.size).toBeGreaterThan(0);
    measuredLine = new LineString([
      //coordinates in the Map's default projection
      [12, 50],
      [13, 49],
    ]);
    measurement = service.formatLength(measuredLine);
    expect(measurement.unit).toBe('m');
    expect(measurement.size).toBeGreaterThan(0);
  });

  it('format area measurements', () => {
    service.map = new Map();
    let measuredLine = new Polygon([
      //coordinates in the Map's default projection
      [
        [1623, 47627],
        [234, 785],
        [-156, -61],
      ],
    ]);
    let measurement = service.formatArea(measuredLine);
    //expect(measurement.unit).toBe('km');
    expect(measurement.size).toBeGreaterThan(0);
    measuredLine = new Polygon([
      //coordinates in the Map's default projection
      [
        [12, 50],
        [13, 49],
        [13, 50],
      ],
    ]);
    measurement = service.formatArea(measuredLine);
    expect(measurement.unit).toBe('m');
    expect(measurement.size).toBeGreaterThan(0);
  });
});
