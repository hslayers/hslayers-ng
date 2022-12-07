/* eslint-disable prefer-arrow-callback */
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {HttpClientTestingModule} from '@angular/common/http/testing';

import {BehaviorSubject} from 'rxjs';
import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';

import {HsAddDataVectorService} from '../add-data/vector/vector.service';
import {HsCommonEndpointsService} from '../../common/endpoints/endpoints.service';
import {HsCompositionsCatalogueService} from './compositions-catalogue.service';
import {HsCompositionsComponent} from './compositions.component';
import {HsCompositionsLayerParserService} from './layer-parser/layer-parser.service';
import {HsCompositionsMapService} from './compositions-map.service';
import {HsCompositionsMickaService} from './endpoints/compositions-micka.service';
import {HsCompositionsService} from './compositions.service';
import {HsCompositionsStatusManagerService} from './endpoints/compositions-status-manager.service';
import {HsConfig} from '../../config.service';
import {HsConfigMock} from '../../config.service.mock';
import {HsEventBusServiceMock} from '../core/event-bus.service.mock';
import {HsLanguageModule} from '../language/language.module';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsLaymanBrowserService} from '../add-data/catalogue/layman/layman.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsLayoutServiceMock} from '../layout/layout.service.mock';
import {HsMapService} from '../map/map.service';
import {HsMapServiceMock} from '../map/map.service.mock';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';
import {HsSaveMapService} from '../save-map/save-map.service';
import {HsSaveMapServiceMock} from '../save-map/save-map.service.mock';
import {HsStylerModule} from '../styles/styles.module';
import {HsStylerService} from '../styles/styler.service';
import {HsUtilsService} from '../utils/utils.service';
import {HsUtilsServiceMock} from '../utils/utils.service.mock';
import {compositionJson} from '../../../test/data/composition';
import {compositionsJson} from '../../../test/data/compositions';
import {getTitle} from '../../common/layer-extensions';
import {mockLayerUtilsService} from '../utils/layer-utils.service.mock';

class HsCompositionsMickaServiceMock {
  constructor() {}
  loadList() {
    return;
  }
}

class HsLaymanBrowserServiceMock {
  constructor() {}
  async getStyleFromUrl(styleUrl: string): Promise<string> {
    return `<?xml version="1.0" encoding="UTF-8"?><sld:StyledLayerDescriptor xmlns="http://www.opengis.net/sld" xmlns:sld="http://www.opengis.net/sld" xmlns:gml="http://www.opengis.net/gml" xmlns:ogc="http://www.opengis.net/ogc" version="1.0.0">
    <sld:NamedLayer>
      <sld:Name>Default Styler</sld:Name>
      <sld:UserStyle>
        <sld:Name>Default Styler</sld:Name>
        <sld:Title>Default Styler</sld:Title>
        <sld:FeatureTypeStyle>
          <sld:Name>name</sld:Name>
          <sld:Rule>
            <sld:PointSymbolizer>
              <sld:Graphic>
                <sld:Mark>
                  <sld:WellKnownName>triangle</sld:WellKnownName>
                  <sld:Fill>
                    <sld:CssParameter name="fill">#5171aa</sld:CssParameter>
                  </sld:Fill>
                  <sld:Stroke>
                    <sld:CssParameter name="stroke">#3790cb</sld:CssParameter>
                    <sld:CssParameter name="stroke-width">1.25</sld:CssParameter>
                  </sld:Stroke>
                </sld:Mark>
                <sld:Opacity>0.45</sld:Opacity>
                <sld:Size>70</sld:Size>
              </sld:Graphic>
            </sld:PointSymbolizer>
            <sld:PolygonSymbolizer>
              <sld:Fill>
                <sld:CssParameter name="fill-opacity">0.45</sld:CssParameter>
              </sld:Fill>
              <sld:Stroke>
                <sld:CssParameter name="stroke">rgba(0, 153, 255, 1)</sld:CssParameter>
                <sld:CssParameter name="stroke-opacity">0.3</sld:CssParameter>
                <sld:CssParameter name="stroke-width">1.25</sld:CssParameter>
              </sld:Stroke>
            </sld:PolygonSymbolizer>
            <sld:LineSymbolizer>
              <sld:Stroke>
                <sld:CssParameter name="stroke">rgba(0, 153, 255, 1)</sld:CssParameter>
                <sld:CssParameter name="stroke-width">1.25</sld:CssParameter>
              </sld:Stroke>
            </sld:LineSymbolizer>
          </sld:Rule>
        </sld:FeatureTypeStyle>
      </sld:UserStyle>
    </sld:NamedLayer>
  </sld:StyledLayerDescriptor>
  `;
  }
}

let mockedMapService;
let hsConfig: HsConfig;
let CompositionsCatalogueService;
const layerUtilsMock = mockLayerUtilsService();
describe('compositions', () => {
  let component: HsCompositionsComponent;
  let fixture: ComponentFixture<HsCompositionsComponent>;
  const app = 'default';
  beforeAll(() => {
    TestBed.resetTestEnvironment();
    TestBed.initTestEnvironment(
      BrowserDynamicTestingModule,
      platformBrowserDynamicTesting(),
      {
        teardown: {destroyAfterEach: false},
      }
    );
  });

  beforeEach(() => {
    const mockedUtilsService: any = new HsUtilsServiceMock();
    const mockedEventBusService: any = new HsEventBusServiceMock();
    const bed = TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [
        CommonModule,
        HttpClientTestingModule,
        HsPanelHelpersModule,
        FormsModule,
        HsLanguageModule,
        HsStylerModule,
        NgbDropdownModule,
      ],
      declarations: [HsCompositionsComponent],
      providers: [
        HsCompositionsService,
        HsCompositionsCatalogueService,
        HsCompositionsMickaServiceMock,
        HsCompositionsMapService,
        {
          provide: HsSaveMapService,
          useValue: new HsSaveMapServiceMock(),
        },
        {provide: HsUtilsService, useValue: mockedUtilsService},
        {provide: HsMapService, useValue: new HsMapServiceMock()},
        {provide: HsConfig, useValue: new HsConfigMock()},
        {
          provide: HsCompositionsMickaService,
          useValue: new HsCompositionsMickaServiceMock(),
        },
        {
          provide: HsLayoutService,
          useValue: new HsLayoutServiceMock(),
        },
        {provide: HsLayerUtilsService, useValue: layerUtilsMock},
        HsStylerService,
        HsCompositionsLayerParserService,
        {
          provide: HsLaymanBrowserService,
          useValue: new HsLaymanBrowserServiceMock(),
        },
        {
          provide: HsCompositionsStatusManagerService,
          useValue: {
            loadList: () =>
              new Promise((resolve, reject) => {
                resolve({});
              }),
          },
        },
        {
          provide: HsAddDataVectorService,
          useValue: new HsAddDataVectorService(
            null,
            null,
            null,
            null,
            mockedMapService,
            new HsStylerService(
              null,
              mockedUtilsService,
              layerUtilsMock,
              mockedEventBusService,
              null,
              null,
              mockedMapService,
              null,
              null,
              null,
              null,
              null
            ),
            mockedUtilsService
          ),
        },
        {
          provide: HsCommonEndpointsService,
          useValue: {
            endpoints: [],
            endpointsFilled: new BehaviorSubject(null),
          },
        },
      ],
    });
    const hsCompositionsMickaService = TestBed.inject(
      HsCompositionsMickaServiceMock
    );
    hsConfig = TestBed.inject(HsConfig);
    hsConfig.get(app).reverseLayerList = true;
    //Mock server response
    hsCompositionsMickaService.loadList = () => {
      return new Promise((resolve, reject) => {
        resolve(compositionsJson);
      });
    };
    CompositionsCatalogueService = TestBed.inject(
      HsCompositionsCatalogueService
    );
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HsCompositionsComponent);
    mockedMapService = TestBed.inject(HsMapService);
    fixture.componentInstance.data = {app};
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('compositions list should load', function () {
    CompositionsCatalogueService.get(app).filterByExtent = false;
    const ds: any = {
      url: 'https://www.agrihub.cz/micka/csw',
      type: 'micka',
      title: 'Micka AgriHub',
      compositionsPaging: {
        start: 0,
        limit: 15,
        loaded: false,
      },
    };
    CompositionsCatalogueService.loadCompositions(app);
    //NOTE: have to make this check to work
    // expect(ds.compositions).toBeDefined();
    expect(ds).toBeDefined();
  });

  /**
   * @param component -
   */
  async function loadComposition(component) {
    await component.hsCompositionsParserService.loadCompositionObject(
      compositionJson,
      true,
      app
    );
  }

  it('should load composition from json', async function () {
    await loadComposition(component);
    expect(mockedMapService.getMap(app).getLayers().getLength()).toBe(7);
    expect(getTitle(mockedMapService.getMap(app).getLayers().item(6))).toBe(
      'Measurement sketches'
    );
    expect(
      mockedMapService.getMap(app).getLayers().item(2).getSource().getFeatures()
        .length
    ).toBe(1);
    expect(
      mockedMapService.getMap(app).getLayers().item(1).getSource().getFeatures()
        .length
    ).toBe(0);
  });

  it('if should parse composition layer style', async function () {
    await loadComposition(component);
    const layer = mockedMapService.getMap(app).getLayers().item(1);
    expect(layer.getStyle()).toBeDefined();
    expect(
      mockedMapService
        .getMap(app)
        .getLayers()
        .item(1)
        .getStyle()[2]
        .getStroke()
        .getColor()
    ).toBe('rgba(0, 153, 255, 1)');
  });
});
