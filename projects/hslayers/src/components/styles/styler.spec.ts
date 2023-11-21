import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {HttpClientTestingModule} from '@angular/common/http/testing';

import {Feature} from 'ol';
import {Point, Polygon} from 'ol/geom';
import {Style} from 'ol/style';
import {Vector as VectorLayer} from 'ol/layer';
import {Vector as VectorSource} from 'ol/source';

import {HsConfig} from '../../config.service';
import {HsConfigMock} from '../../config.service.mock';
import {HsDownloadModule} from '../../common/download/download.module';
import {HsEventBusService} from '../core/event-bus.service';
import {HsEventBusServiceMock} from '../core/event-bus.service.mock';
import {HsLanguageModule} from '../language/language.module';
import {HsLayerUtilsService} from './../utils/layer-utils.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsLayoutServiceMock} from '../layout/layout.service.mock';
import {HsMapService} from '../map/map.service';
import {HsMapServiceMock} from '../map/map.service.mock';
import {HsQueryVectorService} from '../query/query-vector.service';
import {HsSaveMapService} from './../save-map/save-map.service';
import {HsSaveMapServiceMock} from '../save-map/save-map.service.mock';
import {HsStylerComponent} from './styler.component';
import {HsStylerService} from './styler.service';
import {HsUtilsService} from '../utils/utils.service';
import {HsUtilsServiceMock} from '../utils/utils.service.mock';

class emptyMock {
  constructor() {}
}
class HsLayerUtilsServiceMock {
  constructor() {}
  isLayerClustered() {
    return false;
  }
}

describe('HsStyler', () => {
  let layer;

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

  let fixture: ComponentFixture<HsStylerComponent>;
  let component: HsStylerComponent;
  let service: HsStylerService;
  beforeEach(() => {
    layer = new VectorLayer({
      properties: {title: 'Point'},
      source: new VectorSource<Feature<Point | Polygon>>({
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
    TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [
        FormsModule,
        HttpClientTestingModule,
        HsLanguageModule,
        HsDownloadModule,
      ],
      declarations: [HsStylerComponent],
      providers: [
        HsStylerService,
        {provide: HsLayerUtilsService, useValue: new HsLayerUtilsServiceMock()},
        {provide: HsSaveMapService, useValue: new HsSaveMapServiceMock()},
        {provide: HsMapService, useValue: new HsMapServiceMock()},
        {provide: HsUtilsService, useValue: new HsUtilsServiceMock()},
        {provide: HsLayoutService, useValue: new HsLayoutServiceMock()},
        {provide: HsQueryVectorService, useValue: new emptyMock()},
        {provide: HsEventBusService, useValue: new HsEventBusServiceMock()},
        {provide: HsConfig, useValue: new HsConfigMock()},
      ],
    }); //.compileComponents();
    fixture = TestBed.createComponent(HsStylerComponent);
    service = TestBed.inject(HsStylerService);
    component = fixture.componentInstance;
    fixture.detectChanges();
    service.fill(layer);
    service.styleObject = {name: 'Test', rules: []};
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should change style', async () => {
    service.addRule('Simple');
    service.styleObject.rules[0].symbolizers = [{color: '#000', kind: 'Fill'}];
    await service.save();
    expect(service.layer.get('sld').replace(/\s/g, '')).toBe(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><StyledLayerDescriptor version="1.0.0" xsi:schemaLocation="http://www.opengis.net/sld StyledLayerDescriptor.xsd" xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:se="http://www.opengis.net/se"><NamedLayer><Name>Test</Name><UserStyle><Name>Test</Name><Title>Test</Title><FeatureTypeStyle><Rule><Name>Untitled rule</Name><PolygonSymbolizer><Fill><CssParameter name="fill">#000</CssParameter></Fill></PolygonSymbolizer></Rule></FeatureTypeStyle></UserStyle></NamedLayer></StyledLayerDescriptor>`.replace(
        /\s/g,
        '',
      ),
    );
    expect((service.layer.getStyle() as Style).getFill()).toBeDefined();
  });

  it('should issue onSet event when style changes', async () => {
    const nextSpy = spyOn(service.onSet, 'next');
    await service.save();
    expect(nextSpy).toHaveBeenCalled();
  });

  it('SLD should be generated from OL style', async () => {
    const style = await service.parseStyle({fill: {color: '#000000'}});
    const sld = style.sld.replace(/\s/g, '');
    expect(sld).toBe(
      `<?xmlversion="1.0"encoding="UTF-8"standalone="yes"?><StyledLayerDescriptorversion="1.0.0"xsi:schemaLocation="http://www.opengis.net/sldStyledLayerDescriptor.xsd"xmlns="http://www.opengis.net/sld"xmlns:ogc="http://www.opengis.net/ogc"xmlns:xlink="http://www.w3.org/1999/xlink"xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"xmlns:se="http://www.opengis.net/se"><NamedLayer><Name>rule</Name><UserStyle><Name>rule</Name><Title>rule</Title><FeatureTypeStyle><Rule><Name>rule</Name><PolygonSymbolizer><Fill><CssParametername="fill">#000000</CssParameter></Fill></PolygonSymbolizer></Rule></FeatureTypeStyle></UserStyle></NamedLayer></StyledLayerDescriptor>`.replace(
        /\s/g,
        '',
      ),
    );
  });
});
