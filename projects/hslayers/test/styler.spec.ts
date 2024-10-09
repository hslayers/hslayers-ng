import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';
import {provideHttpClientTesting} from '@angular/common/http/testing';

import {Circle, Fill, Stroke, Style} from 'ol/style';
import {Feature} from 'ol';
import {Point, Polygon} from 'ol/geom';
import {Vector as VectorLayer} from 'ol/layer';
import {Vector as VectorSource} from 'ol/source';

import {HsConfig} from 'hslayers-ng/config';
import {HsConfigMock} from './config.service.mock';
import {HsDownloadModule} from 'hslayers-ng/common/download';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsEventBusServiceMock} from './event-bus.service.mock';
import {
  HsLayerSynchronizerService,
  HsSaveMapService,
} from 'hslayers-ng/services/save-map';
import {HsLayerUtilsService} from 'hslayers-ng/services/utils';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {HsLayoutServiceMock} from './layout.service.mock';
import {HsMapService} from 'hslayers-ng/services/map';
import {HsMapServiceMock} from './map.service.mock';
import {HsQueryVectorService} from 'hslayers-ng/services/query';
import {HsSaveMapServiceMock} from './save-map.service.mock';
import {HsStylerComponent} from 'hslayers-ng/components/styler';
import {HsStylerService} from 'hslayers-ng/services/styler';
import {HsUtilsService} from 'hslayers-ng/services/utils';
import {HsUtilsServiceMock} from './utils/utils.service.mock';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';

class emptyMock {
  constructor() {}
}
class HsLayerUtilsServiceMock {
  constructor() {}
  isLayerClustered() {
    return false;
  }
}

class HsLayerSynchronizerServiceMock {
  syncedLayers: VectorLayer<VectorSource<Feature>>[] = [];
  constructor() {}
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
    const mockedConfig = new HsConfigMock();

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
      declarations: [HsStylerComponent],
      imports: [FormsModule, TranslateCustomPipe, HsDownloadModule],
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        {
          provide: HsLayerUtilsService,
          useValue: new HsLayerUtilsServiceMock(),
        },
        {provide: HsSaveMapService, useValue: new HsSaveMapServiceMock()},
        {provide: HsMapService, useValue: new HsMapServiceMock()},
        {provide: HsUtilsService, useValue: new HsUtilsServiceMock()},
        {
          provide: HsLayoutService,
          useValue: new HsLayoutServiceMock(mockedConfig),
        },
        {provide: HsQueryVectorService, useValue: new emptyMock()},
        {provide: HsEventBusService, useValue: new HsEventBusServiceMock()},
        {provide: HsConfig, useValue: mockedConfig},
        {
          provide: HsLayerSynchronizerService,
          useValue: new HsLayerSynchronizerServiceMock(),
        },
        HsStylerService,
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
    const style = new Style({
      image: new Circle({
        fill: new Fill({
          color: 'rgba(0, 157, 87, 0.5)',
        }),
        stroke: new Stroke({
          color: 'rgb(0, 157, 87)',
          width: 2,
        }),
        radius: 5,
      }),
    });

    const sld = await service.olStyleToSld(style);
    expect(sld).toBe(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><StyledLayerDescriptor version="1.0.0" xsi:schemaLocation="http://www.opengis.net/sld StyledLayerDescriptor.xsd" xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:se="http://www.opengis.net/se"><NamedLayer><Name>OL Style</Name><UserStyle><Name>OL Style</Name><Title>OL Style</Title><FeatureTypeStyle><Rule><Name>OL Style Rule 0</Name><PointSymbolizer><Graphic><Mark><WellKnownName>circle</WellKnownName><Fill><CssParameter name="fill">#009d57</CssParameter><CssParameter name="fill-opacity">0.5</CssParameter></Fill><Stroke><CssParameter name="stroke">rgb(0, 157, 87)</CssParameter><CssParameter name="stroke-width">2</CssParameter></Stroke></Mark><Size>10</Size></Graphic></PointSymbolizer></Rule></FeatureTypeStyle></UserStyle></NamedLayer></StyledLayerDescriptor>`,
    );
  });
});
