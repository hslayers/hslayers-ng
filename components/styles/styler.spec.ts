import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import VectorLayer from 'ol/layer/Vector';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {HsLayerUtilsService} from './../utils/layer-utils.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsQueryVectorService} from '../query/query-vector.service';
import {HsSaveMapService} from './../save-map/save-map.service';
import {HsStylerComponent} from './styler.component';
import {HsStylerService} from './styler.service';
import {HsUtilsService} from '../utils/utils.service';
import {HsUtilsServiceMock} from '../utils/utils.service.mock';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {Polygon} from 'ol/geom';
import {TranslateModule} from '@ngx-translate/core';
import {Vector as VectorSource} from 'ol/source';
import {createDefaultStyle} from 'ol/style/Style';

class emptyMock {
  constructor() {}
}
class HsLayerUtilsServiceMock {
  constructor() {}
  isLayerClustered() {
    return false;
  }
}
class HsSaveMapServiceMock {
  constructor() {}
  serializeStyle(s: any) {
    const o: any = {};
    if (s.getFill() && s.getFill() !== null) {
      o.fill = s.getFill().getColor();
    }
    if (s.getStroke() && s.getStroke() !== null) {
      o.stroke = {
        color: s.getStroke().getColor(),
        width: s.getStroke().getWidth(),
      };
    }
    if (s.getImage() && s.getImage() !== null) {
      const style_img = s.getImage();
      const ima: any = {};
      if (
        style_img.getFill &&
        style_img.getFill() &&
        style_img.getFill() !== null
      ) {
        ima.fill = style_img.getFill().getColor();
      }

      if (
        style_img.getStroke &&
        style_img.getStroke() &&
        style_img.getStroke() !== null
      ) {
        ima.stroke = {
          color: style_img.getStroke().getColor(),
          width: style_img.getStroke().getWidth(),
        };
      }

      if (style_img.getRadius) {
        ima.radius = style_img.getRadius();
      }
      o.image = ima;
    }
    return o;
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
        {provide: HsLayerUtilsService, useValue: new HsLayerUtilsServiceMock()},
        {provide: HsSaveMapService, useValue: new HsSaveMapServiceMock()},
        {provide: HsUtilsService, useValue: new HsUtilsServiceMock()},
        {provide: HsLayoutService, useValue: new emptyMock()},
        {provide: HsQueryVectorService, useValue: new emptyMock()},
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

  it('detect geometry types', () => {
    component.refreshLayerDefinition();
    expect(component.hasLine).toBe(false);
    expect(component.hasPoly).toBe(true);
    expect(component.hasPoint).toBe(true);
  });
  it('should resolve style function', () => {
    service.layer.setStyle(createDefaultStyle);
    component.refreshLayerDefinition();
    expect(component.linecolor).toBeDefined();
    expect(component.linecolor['background-color']).toBe(
      'rgba(51, 153, 204, 1)'
    );
  });
  it('change style', () => {
    component.fillcolor = {
      'background-color': 'rgba(244, 235, 55, 1)',
    };
    component.save();
    expect(service.layer.getStyle().getFill()).toBeDefined();
  });
});
