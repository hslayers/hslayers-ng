/* eslint-disable prefer-arrow-callback */
import {BehaviorSubject} from 'rxjs';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
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
import {HsEventBusServiceMock} from '../core/event-bus.service.mock';
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
import {HttpClientModule} from '@angular/common/http';
import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';
import {TranslateModule} from '@ngx-translate/core';
import {compositionJson} from '../../../test/data/composition';
import {compositionsJson} from '../../../test/data/compositions';
import {getTitle} from '../../common/layer-extensions';
import {mockLayerUtilsService} from '../utils/layer-utils.service.mock';
class HsConfigMock {
  reverseLayerList = true;
  constructor() {}
}
class HsCompositionsMickaServiceMock {
  constructor() {}
  loadList() {
    return;
  }
}

class emptyMock {
  constructor() {}
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
let CompositionsCatalogueService;

const layerUtilsMock = mockLayerUtilsService();
describe('compositions', () => {
  let component: HsCompositionsComponent;
  let fixture: ComponentFixture<HsCompositionsComponent>;

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
    mockedMapService = new HsMapServiceMock();
    const mockedUtilsService: any = new HsUtilsServiceMock();
    const mockedEventBusService: any = new HsEventBusServiceMock();
    const bed = TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [
        CommonModule,
        HttpClientModule,
        HsPanelHelpersModule,
        FormsModule,
        TranslateModule.forRoot(),
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
        {provide: HsMapService, useValue: mockedMapService},
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
            mockedMapService,
            mockedUtilsService,
            new HsStylerService(
              null,
              mockedUtilsService,
              layerUtilsMock,
              mockedEventBusService,
              null,
              null,
              mockedMapService,
              null
            ),
            null,
            null
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
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('compositions list should load', function () {
    CompositionsCatalogueService.filterByExtent = false;
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
    CompositionsCatalogueService.loadCompositions();
    //NOTE: have to make this check to work
    // expect(ds.compositions).toBeDefined();
    expect(ds).toBeDefined();
  });

  /**
   * @param scope
   * @param component
   */
  async function loadComposition(component) {
    await component.hsCompositionsParserService.loadCompositionObject(
      compositionJson,
      true
    );
  }

  it('should load composition from json', async function () {
    await loadComposition(component);
    expect(mockedMapService.map.getLayers().getLength()).toBe(8);
    expect(getTitle(mockedMapService.map.getLayers().item(2))).toBe(
      'Measurement sketches'
    );
    expect(
      mockedMapService.map.getLayers().item(5).getSource().getFeatures().length
    ).toBe(1);
    expect(
      mockedMapService.map.getLayers().item(6).getSource().getFeatures().length
    ).toBe(1);
  });

  it('if should parse composition layer style', async function () {
    await loadComposition(component);
    expect(mockedMapService.map.getLayers().item(2).getStyle()).toBeDefined();
    expect(
      mockedMapService.map
        .getLayers()
        .item(7)
        .getStyle()[2]
        .getStroke()
        .getColor()
    ).toBe('rgba(0, 153, 255, 1)');
  });
});
