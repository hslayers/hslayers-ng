import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {TranslateModule} from '@ngx-translate/core';

import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import VectorLayer from 'ol/layer/Vector';
import {Circle, Fill, Stroke, Style} from 'ol/style';
import {Vector as VectorSource} from 'ol/source';

import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsLayerUtilsServiceMock} from '../utils/layer-utils.service.mock';
import {HsLayoutService} from '../layout/layout.service';
import {HsLayoutServiceMock} from '../layout/layout.service.mock';
import {HsLegendComponent} from './legend.component';
import {HsLegendLayerComponent} from './legend-layer.component';
import {HsLegendLayerStaticComponent} from './legend-layer-static.component';
import {HsLegendLayerVectorComponent} from './legend-layer-vector.component';
import {HsLegendService} from './legend.service';
import {HsMapService} from '../map/map.service';
import {HsMapServiceMock} from '../map/map.service.mock';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';
import {HsUtilsService} from '../utils/utils.service';
import {HsUtilsServiceMock} from '../utils/utils.service.mock';

describe('HsLegendLayerComponent', () => {
  beforeAll(() => {
    TestBed.resetTestEnvironment();
    TestBed.initTestEnvironment(
      BrowserDynamicTestingModule,
      platformBrowserDynamicTesting()
    );
  });
  let parentComponent: HsLegendComponent;
  let parentFixture: ComponentFixture<HsLegendComponent>;
  let component: HsLegendLayerComponent;
  let fixture: ComponentFixture<HsLegendLayerComponent>;
  let service: HsLegendService;
  beforeEach(async () => {
    TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [HsPanelHelpersModule, TranslateModule.forRoot()],
      declarations: [
        HsLegendComponent,
        HsLegendLayerComponent,
        HsLegendLayerVectorComponent,
        HsLegendLayerStaticComponent,
      ],
      providers: [
        HsLegendService,
        {provide: HsUtilsService, useValue: new HsUtilsServiceMock()},
        {provide: HsLayerUtilsService, useValue: new HsLayerUtilsServiceMock()},
        {provide: HsMapService, useValue: new HsMapServiceMock()},
        {provide: HsLayoutService, useValue: new HsLayoutServiceMock()},
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    parentFixture = TestBed.createComponent(HsLegendComponent);
    parentComponent = parentFixture.componentInstance;
    parentFixture.detectChanges();
    fixture = TestBed.createComponent(HsLegendLayerComponent);
    component = fixture.componentInstance;
    service = TestBed.get(HsLegendService);
  });
  it('should create', () => {
    expect(parentComponent).toBeTruthy();
  });
  it('should generate vector layer', () => {
    const count = 20;
    const features = new Array(count);
    const e = 4500000;
    for (let i = 0; i < count; ++i) {
      const coordinates = [
        2 * e * Math.random() - e,
        2 * e * Math.random() - e,
      ];
      features[i] = new Feature({
        geometry: new Point(coordinates),
        name: 'test',
      });
    }
    const layer = new VectorLayer({
      title: 'Bookmarks',
      cluster: true,
      inlineLegend: true,
      editor: {
        editable: true,
        defaultAttributes: {
          name: 'New bookmark',
          description: 'none',
        },
      },
      path: 'User generated',
      source: new VectorSource({features}),
    });
    parentComponent.addLayerToLegends(layer);
    expect(parentComponent.layerDescriptors.length).toBeDefined();
    expect(parentComponent.layerDescriptors[0].title).toBe('Bookmarks');
  });
  it('should create layer feature style and geometry type', () => {
    const count = 20;
    const features = new Array(count);
    const e = 4500000;
    for (let i = 0; i < count; ++i) {
      const coordinates = [
        2 * e * Math.random() - e,
        2 * e * Math.random() - e,
      ];
      features[i] = new Feature({
        geometry: new Point(coordinates),
        name: 'test',
      });
    }
    const layer = new VectorLayer({
      title: 'Bookmarks',
      cluster: true,
      inlineLegend: true,
      editor: {
        editable: true,
        defaultAttributes: {
          name: 'New bookmark',
          description: 'none',
        },
      },
      path: 'User generated',
      source: new VectorSource({features}),
    });
    parentComponent.addLayerToLegends(layer);
    const expectedLayer = parentComponent.layerDescriptors[0];
    component.layer = expectedLayer;
    fixture.detectChanges();
    component.ngOnInit();
    expect(component.styles[0].customCircle).toBeDefined();
    expect(component.geometryTypes[0]).toEqual('point');
  });
  it('should turn off clustered features and change layer style', () => {
    const count = 20;
    const features = new Array(count);
    const e = 4500000;
    for (let i = 0; i < count; ++i) {
      const coordinates = [
        2 * e * Math.random() - e,
        2 * e * Math.random() - e,
      ];
      features[i] = new Feature({
        geometry: new Point(coordinates),
        name: 'test',
      });
    }
    const layer = new VectorLayer({
      title: 'Bookmarks',
      cluster: true,
      inlineLegend: true,
      editor: {
        editable: true,
        defaultAttributes: {
          name: 'New bookmark',
          description: 'none',
        },
      },
      path: 'User generated',
      source: new VectorSource({features}),
    });
    parentComponent.addLayerToLegends(layer);
    const expectedLayer = parentComponent.layerDescriptors[0];
    component.layer = expectedLayer;
    fixture.detectChanges();
    component.ngOnInit();
    component.layer.lyr.set('cluster', false);
    fixture.detectChanges();
    const customStyle = new Style({
      image: new Circle({
        fill: new Fill({
          color: 'rgba(255, 0, 0, 0.4)',
        }),
        stroke: new Stroke({
          color: '#ff3333',
          width: 1,
        }),
        radius: 5,
      }),
    });
    component.layer.lyr.setStyle(customStyle);
    fixture.detectChanges();
    service.setUpLegendStyle(
      customStyle.getFill(),
      customStyle.getStroke(),
      customStyle.getImage()
    );
    component.ngOnInit();
    expect(component.layer.lyr.get('cluster')).toBeFalse();
    expect(component.styles[0].customCircle.fill).toEqual(
      'rgba(255, 0, 0, 0.4)'
    );
    expect(component.styles[0].customCircle.stroke).toEqual('#ff3333');
    expect(component.geometryTypes[0]).toEqual('point');
  });
});
