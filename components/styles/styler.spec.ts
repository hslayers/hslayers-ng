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
import {HsLayerEditorVectorLayerService} from './../layermanager/layer-editor-vector-layer.service';
import {HsLayerUtilsService} from './../utils/layer-utils.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsMapService} from '../map/map.service';
import {HsMapServiceMock} from '../map/map.service.mock';
import {HsStylerComponent} from './styler.component';
import {HsStylerService} from './styler.service';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {Polygon} from 'ol/geom';
import {TranslateModule, TranslateStore} from '@ngx-translate/core';
import {Vector as VectorSource} from 'ol/source';

class emptyMock {
  constructor() {}
}
class HsLayerEditorVectorLayerServiceMock {
  constructor() {}
  styleLayer() {
    return;
  }
}
class HsLayerUtilsServiceMock {
  constructor() {}
  isLayerClustered() {
    return false;
  }
}

describe('HsStyler', () => {
  const layer = new VectorLayer({
    title: 'Point',
    source: new VectorSource({
      features: [
        new Feature({geometry: new Point([0, 0]), name: 'test'}),
        new Feature({
          geometry: new Polygon([
            [
              [1e6, 6e6],
              [1e6, 8e6],
              [3e6, 8e6],
              [3e6, 6e6],
              [1e6, 6e6],
            ],
          ]),
          name: 'test',
        }),
      ],
    }),
  });

  beforeAll(() => {
    TestBed.resetTestEnvironment();
    TestBed.initTestEnvironment(
      BrowserDynamicTestingModule,
      platformBrowserDynamicTesting()
    );
  });

  let fixture: ComponentFixture<HsStylerComponent>;
  let component: HsStylerComponent;
  let service: HsStylerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [
        FormsModule,
        HttpClientTestingModule,
        TranslateModule.forRoot(),
      ],
      declarations: [HsStylerComponent],
      providers: [
        HsStylerService,
        TranslateStore,
        {
          provide: HsLayerEditorVectorLayerService,
          useValue: new HsLayerEditorVectorLayerServiceMock(),
        },
        {provide: HsLayerUtilsService, useValue: new HsLayerUtilsServiceMock()},
        {provide: HsLayoutService, useValue: new emptyMock()},
      ],
    }); //.compileComponents();
    fixture = TestBed.createComponent(HsStylerComponent);
    service = TestBed.get(HsStylerService);
    component = fixture.componentInstance;
    fixture.detectChanges();
    service.layer = layer;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('HasLinePointPoly', () => {
    component.updateHasVectorFeatures();
    expect(component.hasLine).toBe(false);
    expect(component.hasPoly).toBe(true);
    expect(component.hasPoint).toBe(true);
  });
  it('styleChange', () => {
    component.fillcolor = {
      'background-color': 'rgba(244, 235, 55, 1)',
    };
    component.save();
    expect(service.layer.getStyle().getFill()).toBeDefined();
  });
});
