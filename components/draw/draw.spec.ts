import Feature from 'ol/Feature';
import Map from 'ol/Map';
import Point from 'ol/geom/Point';
import VectorLayer from 'ol/layer/Vector';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';

import {HsDrawComponent} from './draw.component';
import {HsDrawService} from './draw.service';

import {HsLayoutService} from '../layout/layout.service.js';
import {HsMapService} from '../map/map.service';
import {HsMapServiceMock} from '../map/map.service.mock';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsLayerUtilsServiceMock} from '../utils/layer-utils.service.mock';
import {HsConfig} from '../../config.service';
import {HsQueryBaseService} from '../query/query-base.service.js';
import {HsQueryVectorService} from '../query/query-vector.service.js';

import {Polygon} from 'ol/geom';
import {Vector as VectorSource} from 'ol/source';

class emptyMock {
  constructor() {}
}
class HsConfigMock {
    constructor() {}
  }

class HsQueryVectorMock {
constructor() {}
}

describe('HsDraw', () => {
  const mockLayoutService = jasmine.createSpyObj("HsLayoutService", ["sidebarBottom", "panelVisible"]);
  const mockLayerUtilsService = jasmine.createSpyObj("HsLayerUtilsService", ["isLayerDrawable","isLayerClustered"]);
  const mockQueryBaseService = jasmine.createSpyObj("HsQueryBaseService", ["activateQueries","deactivateQueries"]);

  const layer = new VectorLayer({
    title: 'Point',
    source: new VectorSource({}),
  });

  beforeAll(() => {
    TestBed.resetTestEnvironment();
    TestBed.initTestEnvironment(
      BrowserDynamicTestingModule,
      platformBrowserDynamicTesting()
    );
  });

  let fixture: ComponentFixture<HsDrawComponent>;
  let component: HsDrawComponent;
  let service: HsDrawService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [FormsModule],
      declarations: [HsDrawComponent],
      providers: [
        HsDrawService,
        {provide: HsLayoutService, useValue: mockLayoutService},
        {provide: HsMapService, useValue: new HsMapServiceMock()},
        {provide: HsLayerUtilsService, useValue: mockLayerUtilsService},
        {provide: HsConfig, useValue: new HsConfigMock()},
        {provide: HsQueryBaseService, useValue: mockQueryBaseService},
        {provide: HsQueryVectorService, useValue: new HsQueryVectorMock()},

      ],
    }); //.compileComponents();
    fixture = TestBed.createComponent(HsDrawComponent);
    service = TestBed.get(HsDrawService);
    component = fixture.componentInstance;
    
    fixture.detectChanges();
  });

  it('Draw component should be available', () => {
    expect(component).toBeTruthy();
  });

  it('Activate drawing', () => {
    spyOn(service, 'activateDrawing');

    component.setType('polygon');
    
    expect(service.tmpDrawLayer).toBeDefined();
    expect(service.type).toBe('polygon');
    expect(service.selectedLayer).toBeDefined();
    expect(service.activateDrawing).toHaveBeenCalled();
  });

  it('Select layer', () => {
    component.selectLayer(layer);
    expect(service.source).toBeDefined();
  });
  
});
