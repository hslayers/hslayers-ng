import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import {CUSTOM_ELEMENTS_SCHEMA, signal, WritableSignal} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {provideTranslateService, TranslatePipe} from '@ngx-translate/core';
import {provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';
import {provideHttpClientTesting} from '@angular/common/http/testing';

import {Circle, Fill, Stroke, Style} from 'ol/style';
import {Feature} from 'ol';
import {Point, Polygon} from 'ol/geom';
import {Vector as VectorLayer} from 'ol/layer';
import {Vector as VectorSource} from 'ol/source';

import {HsConfig} from 'hslayers-ng/config';
import {HsConfigMock} from './config.service.mock';
import {HsDownloadDirective} from 'hslayers-ng/common/download';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsEventBusServiceMock} from './event-bus.service.mock';
import {
  HsLayerSynchronizerService,
  HsSaveMapService,
} from 'hslayers-ng/services/save-map';
import {normalizeSldComparisonOperators} from 'hslayers-ng/services/utils';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {HsLayoutServiceMock} from './layout.service.mock';
import {HsMapService} from 'hslayers-ng/services/map';
import {HsMapServiceMock} from './map.service.mock';
import {HsQueryVectorService} from 'hslayers-ng/services/query';
import {HsSaveMapServiceMock} from './save-map.service.mock';
import {HsStylerComponent} from 'hslayers-ng/components/styler';
import {HsStylerService} from 'hslayers-ng/services/styler';

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
  let layer: WritableSignal<VectorLayer<VectorSource<Feature>>>;

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

    layer = signal(
      new VectorLayer({
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
      }),
    );
    TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      declarations: [HsStylerComponent],
      imports: [FormsModule, TranslatePipe, HsDownloadDirective],
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        provideTranslateService(),
        {provide: HsSaveMapService, useValue: new HsSaveMapServiceMock()},
        {provide: HsMapService, useValue: new HsMapServiceMock()},
        {
          provide: HsLayoutService,
          useValue: new HsLayoutServiceMock(),
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
    service.fill(layer());
    service.styleObject = {name: 'Test', rules: []};
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should change style', async () => {
    service.addRule('Simple');
    service.styleObject.rules[0].symbolizers = [{color: '#000', kind: 'Fill'}];
    await service.save();
    expect(service.layer().get('sld').replace(/\s/g, '')).toBe(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><StyledLayerDescriptor version="1.0.0" xsi:schemaLocation="http://www.opengis.net/sld StyledLayerDescriptor.xsd" xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:se="http://www.opengis.net/se"><NamedLayer><Name>Test</Name><UserStyle><Name>Test</Name><Title>Test</Title><FeatureTypeStyle><Rule><Name>Untitled rule</Name><PolygonSymbolizer><Fill><CssParameter name="fill">#000</CssParameter></Fill></PolygonSymbolizer></Rule></FeatureTypeStyle></UserStyle></NamedLayer></StyledLayerDescriptor>`.replace(
        /\s/g,
        '',
      ),
    );
    expect((service.layer().getStyle() as Style).getFill()).toBeDefined();
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

  describe('Function to PropertyIs conversion', () => {
    it('should convert standard operators without namespace', () => {
      const inputSld = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <StyledLayerDescriptor version="1.0.0" xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc">
        <NamedLayer>
          <UserStyle>
            <FeatureTypeStyle>
              <Rule>
                <Filter xmlns="http://www.opengis.net/ogc">
                  <And>
                    <Function name="lessThanOrEqualTo">
                      <PropertyName>value1</PropertyName>
                      <PropertyName>value2</PropertyName>
                    </Function>
                    <Function name="greaterThanOrEqualTo">
                      <PropertyName>value3</PropertyName>
                      <PropertyName>value4</PropertyName>
                    </Function>
                  </And>
                </Filter>
              </Rule>
            </FeatureTypeStyle>
          </UserStyle>
        </NamedLayer>
      </StyledLayerDescriptor>`;

      const convertedSld = normalizeSldComparisonOperators(inputSld);

      // Check standard operators conversion (without namespace)
      expect(convertedSld.includes('<PropertyIsLessThanOrEqualTo>')).toBeTrue();
      expect(
        convertedSld.includes('</PropertyIsLessThanOrEqualTo>'),
      ).toBeTrue();
      expect(
        convertedSld.includes('<PropertyIsGreaterThanOrEqualTo>'),
      ).toBeTrue();
      expect(
        convertedSld.includes('</PropertyIsGreaterThanOrEqualTo>'),
      ).toBeTrue();

      // Should not include original Function elements
      expect(convertedSld.includes('<Function name=')).toBeFalse();
      expect(convertedSld.includes('</Function>')).toBeFalse();
    });

    it('should convert operators with ogc namespace', () => {
      const inputSld = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <StyledLayerDescriptor version="1.0.0" xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc">
        <NamedLayer>
          <UserStyle>
            <FeatureTypeStyle>
              <Rule>
                <ogc:Filter>
                  <ogc:And>
                    <ogc:Function name="lessThan">
                      <ogc:PropertyName>value5</ogc:PropertyName>
                      <ogc:PropertyName>value6</ogc:PropertyName>
                    </ogc:Function>
                    <ogc:Function name="equalTo">
                      <ogc:PropertyName>value7</ogc:PropertyName>
                      <ogc:PropertyName>value8</ogc:PropertyName>
                    </ogc:Function>
                  </ogc:And>
                </ogc:Filter>
              </Rule>
            </FeatureTypeStyle>
          </UserStyle>
        </NamedLayer>
      </StyledLayerDescriptor>`;

      const convertedSld = normalizeSldComparisonOperators(inputSld);

      // Check conversion with ogc namespace
      expect(convertedSld.includes('<ogc:PropertyIsLessThan>')).toBeTrue();
      expect(convertedSld.includes('</ogc:PropertyIsLessThan>')).toBeTrue();
      expect(convertedSld.includes('<ogc:PropertyIsEqualTo>')).toBeTrue();
      expect(convertedSld.includes('</ogc:PropertyIsEqualTo>')).toBeTrue();

      // Should not include original Function elements
      expect(convertedSld.includes('<ogc:Function name=')).toBeFalse();
      expect(convertedSld.includes('</ogc:Function>')).toBeFalse();
    });

    it('should convert operators with indexed namespace', () => {
      const inputSld = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <StyledLayerDescriptor version="1.0.0" xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc">
        <NamedLayer>
          <UserStyle>
            <FeatureTypeStyle>
              <Rule>
                <ns3:Filter xmlns:ns3="http://www.opengis.net/ogc">
                  <ns3:Function name="like">
                    <ns3:PropertyName>value9</ns3:PropertyName>
                    <ns3:Literal>*pattern*</ns3:Literal>
                  </ns3:Function>
                </ns3:Filter>
              </Rule>
            </FeatureTypeStyle>
          </UserStyle>
        </NamedLayer>
      </StyledLayerDescriptor>`;

      const convertedSld = normalizeSldComparisonOperators(inputSld);

      // Check conversion with indexed namespace
      expect(convertedSld.includes('<ns3:PropertyIsLike>')).toBeTrue();
      expect(convertedSld.includes('</ns3:PropertyIsLike>')).toBeTrue();

      // Should not include original Function elements
      expect(convertedSld.includes('<ns3:Function name=')).toBeFalse();
      expect(convertedSld.includes('</ns3:Function>')).toBeFalse();
    });

    it('should convert special operators (notEqualTo, isNull, between)', () => {
      const inputSld = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <StyledLayerDescriptor version="1.0.0" xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc">
        <NamedLayer>
          <UserStyle>
            <FeatureTypeStyle>
              <Rule>
                <ogc:Filter>
                  <ogc:Function name="notEqualTo">
                    <ogc:PropertyName>value10</ogc:PropertyName>
                    <ogc:Literal>test</ogc:Literal>
                  </ogc:Function>
                </ogc:Filter>
              </Rule>
              <Rule>
                <ogc:Filter>
                  <ogc:Function name="isNull">
                    <ogc:PropertyName>value11</ogc:PropertyName>
                  </ogc:Function>
                </ogc:Filter>
              </Rule>
              <Rule>
                <ogc:Filter>
                  <ogc:Function name="between">
                    <ogc:PropertyName>value12</ogc:PropertyName>
                    <ogc:Literal>10</ogc:Literal>
                    <ogc:Literal>20</ogc:Literal>
                  </ogc:Function>
                </ogc:Filter>
              </Rule>
            </FeatureTypeStyle>
          </UserStyle>
        </NamedLayer>
      </StyledLayerDescriptor>`;

      const convertedSld = normalizeSldComparisonOperators(inputSld);

      // Check notEqualTo conversion
      expect(convertedSld.includes('<ogc:PropertyIsNotEqualTo>')).toBeTrue();
      expect(convertedSld.includes('</ogc:PropertyIsNotEqualTo>')).toBeTrue();

      // Check isNull conversion
      expect(convertedSld.includes('<ogc:PropertyIsNull>')).toBeTrue();
      expect(convertedSld.includes('</ogc:PropertyIsNull>')).toBeTrue();

      // Check between conversion
      expect(convertedSld.includes('<ogc:PropertyIsBetween>')).toBeTrue();
      expect(convertedSld.includes('</ogc:PropertyIsBetween>')).toBeTrue();

      // Should not include original Function elements
      expect(convertedSld.includes('<ogc:Function name=')).toBeFalse();
      expect(convertedSld.includes('</ogc:Function>')).toBeFalse();
    });

    it('should handle unknown function names by preserving them', () => {
      const inputSld = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <StyledLayerDescriptor version="1.0.0" xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc">
        <NamedLayer>
          <UserStyle>
            <FeatureTypeStyle>
              <Rule>
                <ogc:Filter>
                  <ogc:Function name="customOperator">
                    <ogc:PropertyName>value</ogc:PropertyName>
                    <ogc:Literal>test</ogc:Literal>
                  </ogc:Function>
                </ogc:Filter>
              </Rule>
            </FeatureTypeStyle>
          </UserStyle>
        </NamedLayer>
      </StyledLayerDescriptor>`;

      const convertedSld = normalizeSldComparisonOperators(inputSld);

      // Unknown operators should remain unchanged
      expect(
        convertedSld.includes('<ogc:Function name="customOperator">'),
      ).toBeTrue();
      expect(convertedSld.includes('</ogc:Function>')).toBeTrue();
    });

    it('should handle mixed namespace variations', () => {
      const inputSld = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <StyledLayerDescriptor version="1.0.0" xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc">
        <NamedLayer>
          <UserStyle>
            <FeatureTypeStyle>
              <Rule>
                <ogc:Filter>
                  <ogc:Function name="equalTo">
                    <ogc:PropertyName>value</ogc:PropertyName>
                    <ogc:Literal>10</ogc:Literal>
                  </Function> <!-- Missing namespace in closing tag -->
                </ogc:Filter>
              </Rule>
            </FeatureTypeStyle>
          </UserStyle>
        </NamedLayer>
      </StyledLayerDescriptor>`;

      const convertedSld = normalizeSldComparisonOperators(inputSld);

      // Check if conversion happened despite mixed namespaces
      expect(convertedSld.includes('<ogc:PropertyIsEqualTo>')).toBeTrue();
      // The mismatched closing tag should be properly converted based on stack
      expect(convertedSld.includes('</PropertyIsEqualTo>')).toBeTrue();
    });

    it('should preserve XML comments near functions', () => {
      const inputSld = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <StyledLayerDescriptor version="1.0.0" xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc">
        <NamedLayer>
          <UserStyle>
            <FeatureTypeStyle>
              <Rule>
                <ogc:Filter>
                  <!-- Comment before function -->
                  <ogc:Function name="equalTo">
                    <ogc:PropertyName>value</ogc:PropertyName>
                    <ogc:Literal>10</ogc:Literal>
                  </ogc:Function>
                  <!-- Comment after function -->
                </ogc:Filter>
              </Rule>
            </FeatureTypeStyle>
          </UserStyle>
        </NamedLayer>
      </StyledLayerDescriptor>`;

      const convertedSld = normalizeSldComparisonOperators(inputSld);

      // Check if conversion happened
      expect(convertedSld.includes('<ogc:PropertyIsEqualTo>')).toBeTrue();
      expect(convertedSld.includes('</ogc:PropertyIsEqualTo>')).toBeTrue();

      // Check if comments were preserved
      expect(
        convertedSld.includes('<!-- Comment before function -->'),
      ).toBeTrue();
      expect(
        convertedSld.includes('<!-- Comment after function -->'),
      ).toBeTrue();
    });

    it('should handle case sensitivity in function names', () => {
      const inputSld = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <StyledLayerDescriptor version="1.0.0" xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc">
        <NamedLayer>
          <UserStyle>
            <FeatureTypeStyle>
              <Rule>
                <ogc:Filter>
                  <ogc:Function name="EqualTo"> <!-- Capitalization is different -->
                    <ogc:PropertyName>value</ogc:PropertyName>
                    <ogc:Literal>10</ogc:Literal>
                  </ogc:Function>
                </ogc:Filter>
              </Rule>
            </FeatureTypeStyle>
          </UserStyle>
        </NamedLayer>
      </StyledLayerDescriptor>`;

      const convertedSld = normalizeSldComparisonOperators(inputSld);

      // Our mapping is case-sensitive, so this should not be converted
      expect(convertedSld.includes('<ogc:Function name="EqualTo">')).toBeTrue();
      expect(convertedSld.includes('</ogc:Function>')).toBeTrue();
      expect(convertedSld.includes('<ogc:PropertyIsEqualTo>')).toBeFalse();
    });

    it('should handle empty or whitespace content in function elements', () => {
      const inputSld = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <StyledLayerDescriptor version="1.0.0" xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc">
        <NamedLayer>
          <UserStyle>
            <FeatureTypeStyle>
              <Rule>
                <ogc:Filter>
                  <ogc:Function name="equalTo">
                    
                  </ogc:Function>
                </ogc:Filter>
              </Rule>
            </FeatureTypeStyle>
          </UserStyle>
        </NamedLayer>
      </StyledLayerDescriptor>`;

      const convertedSld = normalizeSldComparisonOperators(inputSld);

      // The function should be converted despite having empty/whitespace content
      expect(convertedSld.includes('<ogc:PropertyIsEqualTo>')).toBeTrue();
      expect(convertedSld.includes('</ogc:PropertyIsEqualTo>')).toBeTrue();
      expect(convertedSld.includes('<ogc:Function name=')).toBeFalse();
    });
  });
});
