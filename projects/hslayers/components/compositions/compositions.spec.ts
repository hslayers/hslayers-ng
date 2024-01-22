/* eslint-disable prefer-arrow-callback */
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {CommonModule} from '@angular/common';
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {HttpClientTestingModule} from '@angular/common/http/testing';

import {BehaviorSubject, Subject, of} from 'rxjs';
import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';

import {HsAddDataVectorService} from 'hslayers-ng/components/add-data';
import {HsCommonEndpointsService} from 'hslayers-ng/shared/endpoints';
import {HsCommonLaymanService} from 'hslayers-ng/common/layman';
import {HsCompositionsCatalogueService} from './compositions-catalogue.service';
import {HsCompositionsComponent} from './compositions.component';
import {HsCompositionsLayerParserService} from './layer-parser/layer-parser.service';
import {HsCompositionsMapService} from './compositions-map.service';
import {HsCompositionsMickaService} from './endpoints/compositions-micka.service';
import {HsCompositionsService} from './compositions.service';
import {HsConfig} from 'hslayers-ng/config';
import {HsConfigMock} from 'hslayers-ng/config';
import {HsLayerUtilsService} from 'hslayers-ng/shared/utils';
import {HsLayoutService} from 'hslayers-ng/shared/layout';
import {HsLayoutServiceMock} from 'hslayers-ng/shared/layout';
import {HsMapService} from 'hslayers-ng/shared/map';
import {HsMapServiceMock} from 'hslayers-ng/shared/map';
import {HsPanelHeaderComponent} from 'hslayers-ng/common/panels';
import {HsPanelHelpersModule} from 'hslayers-ng/common/panels';
import {HsSaveMapService} from 'hslayers-ng/shared/save-map';
import {HsSaveMapServiceMock} from 'hslayers-ng/shared/save-map';
import {HsStylerModule} from 'hslayers-ng/components/styler';
import {HsStylerService} from 'hslayers-ng/shared/styler';
import {HsUtilsService} from 'hslayers-ng/shared/utils';
import {HsUtilsServiceMock} from 'hslayers-ng/shared/utils';
import {TranslateCustomPipe} from 'hslayers-ng/shared/language';
import {compositionJson} from '../../../test/data/composition';
import {compositionsJson} from '../../../test/data/compositions';
import {getTitle} from 'hslayers-ng/common/extensions';
import {mockLayerUtilsService} from 'hslayers-ng/shared/utils';

class HsCompositionsMickaServiceMock {
  constructor(private originalService: HsCompositionsMickaService) {}
  loadList(ds, params) {
    this.originalService.compositionsReceived(ds, compositionsJson);
    return of(ds);
  }
}

class hsCommonLaymanServiceMock {
  authChange: Subject<void> = new Subject();
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
  constructor() {}
}

let mockedMapService;
let hsConfig: HsConfig;
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
      },
    );
  });

  beforeEach(() => {
    const mockedUtilsService: any = new HsUtilsServiceMock();
    const mockedConfig = new HsConfigMock();
    const mockedMapService: any = new HsMapServiceMock();
    const mockedCommonLaymanService = new hsCommonLaymanServiceMock();
    const mockedStylerService = jasmine.createSpyObj('HsStylerService', [
      'parseStyle',
    ]);

    const bed = TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [
        CommonModule,
        HttpClientTestingModule,
        HsPanelHelpersModule,
        FormsModule,
        TranslateCustomPipe,
        HsStylerModule,
        NgbDropdownModule,
        HsPanelHeaderComponent,
      ],
      declarations: [HsCompositionsComponent],
      providers: [
        HsCompositionsService,
        HsCompositionsCatalogueService,
        {
          provide: HsCompositionsMickaService,
          useValue: new HsCompositionsMickaServiceMock(
            new HsCompositionsMickaService(
              null,
              null,
              null,
              null,
              null,
              null,
              null,
            ),
          ),
        },
        HsCompositionsMapService,
        {
          provide: HsSaveMapService,
          useValue: new HsSaveMapServiceMock(),
        },
        {provide: HsUtilsService, useValue: mockedUtilsService},
        {provide: HsMapService, useValue: mockedMapService},
        {provide: HsConfig, useValue: mockedConfig},
        {
          provide: HsLayoutService,
          useValue: new HsLayoutServiceMock(mockedConfig),
        },
        {provide: HsLayerUtilsService, useValue: layerUtilsMock},
        HsStylerService,
        HsCompositionsLayerParserService,
        {
          provide: HsAddDataVectorService,
          useValue: new HsAddDataVectorService(
            null,
            null,
            null,
            null,
            null,
            mockedMapService,
            mockedStylerService,
            mockedUtilsService,
          ),
        },
        {
          provide: HsCommonEndpointsService,
          useValue: {
            endpoints: [],
            endpointsFilled: new BehaviorSubject(null),
          },
        },
        {
          provide: HsCommonLaymanService,
          useValue: mockedCommonLaymanService,
        },
      ],
    });
    hsConfig = TestBed.inject(HsConfig);
    hsConfig.reverseLayerList = true;
    CompositionsCatalogueService = TestBed.inject(
      HsCompositionsCatalogueService,
    );
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HsCompositionsComponent);
    mockedMapService = TestBed.inject(HsMapService);
    fixture.componentInstance.data = {};
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('compositions list should load', fakeAsync(() => {
    spyOn(CompositionsCatalogueService, 'clearLoadedData').and.returnValue(
      true,
    );
    CompositionsCatalogueService.filterByExtent = false;
    const ds: any = {
      url: 'https://watlas.lesprojekt.cz/micka/csw',
      type: 'micka',
      title: 'Micka AgriHub',
      compositionsPaging: {
        start: 0,
        limit: 15,
        loaded: false,
      },
    };
    CompositionsCatalogueService.endpoints = [ds];
    CompositionsCatalogueService.loadCompositions();
    tick(5000); // Simulate a 5-second delay
    expect(
      CompositionsCatalogueService.endpoints[0].compositions,
    ).toBeDefined();
  }));

  /**
   * @param component -
   */
  async function loadComposition(component) {
    await component.hsCompositionsParserService.loadCompositionObject(
      compositionJson,
      true,
    );
  }

  it('should load composition from json', async function () {
    await loadComposition(component);
    expect(mockedMapService.getMap().getLayers().getLength()).toBe(8);
    expect(getTitle(mockedMapService.getMap().getLayers().item(7))).toBe(
      'Measurement sketches',
    );
    expect(
      mockedMapService.getMap().getLayers().item(3).getSource().getFeatures()
        .length,
    ).toBe(1);
    expect(
      mockedMapService.getMap().getLayers().item(2).getSource().getFeatures()
        .length,
    ).toBe(0);
  });

  it('if should parse composition layer style', async function () {
    await loadComposition(component);
    const layer = mockedMapService.getMap().getLayers().item(1);
    expect(layer.getStyle()).toBeDefined();
    expect(
      mockedMapService
        .getMap()
        .getLayers()
        .item(2)
        .getStyle()[2]
        .getStroke()
        .getColor(),
    ).toBe('rgba(0, 153, 255, 1)');
  });
});
