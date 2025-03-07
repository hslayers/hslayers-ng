/* eslint-disable prefer-arrow-callback */
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import {CUSTOM_ELEMENTS_SCHEMA, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';
import {provideHttpClientTesting} from '@angular/common/http/testing';

import {of} from 'rxjs';
import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';

import {
  HsAddDataVectorService,
  HsAddDataVectorUtilsService,
} from 'hslayers-ng/services/add-data';
import {HsCommonEndpointsService} from 'hslayers-ng/services/endpoints';
import {HsCommonLaymanService} from 'hslayers-ng/common/layman';
import {
  HsCompositionsCatalogueService,
  HsCompositionsComponent,
  HsCompositionsMapService,
  HsCompositionsMickaService,
  HsCompositionsService,
} from 'hslayers-ng/components/compositions';
import {HsCompositionsLayerParserService} from 'hslayers-ng/services/compositions';
import {HsConfig} from 'hslayers-ng/config';
import {HsConfigMock} from './config.service.mock';
import {HsLayerUtilsService, HsUtilsService} from 'hslayers-ng/services/utils';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {HsLayoutServiceMock} from './layout.service.mock';
import {HsMapService} from 'hslayers-ng/services/map';
import {HsMapServiceMock} from './map.service.mock';
import {
  HsPanelHeaderComponent,
  HsPanelHelpersModule,
} from 'hslayers-ng/common/panels';
import {HsSaveMapService} from 'hslayers-ng/services/save-map';
import {HsSaveMapServiceMock} from './save-map.service.mock';
import {HsStylerModule} from 'hslayers-ng/components/styler';
import {HsStylerService} from 'hslayers-ng/services/styler';
import {HsUtilsServiceMock} from './utils/utils.service.mock';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';
import {compositionJson} from './data/composition';
import {compositionsJson} from './data/compositions';
import {getTitle} from 'hslayers-ng/common/extensions';
import {mockLayerUtilsService} from './layer-utils.service.mock';
import {createMockLaymanService} from './common/layman/layman.service.mock';
import {compositionStyleXml} from './data/composition-style';

class HsCompositionsMickaServiceMock {
  constructor(private originalService: HsCompositionsMickaService) {}
  loadList(ds, params) {
    this.originalService.compositionsReceived(ds, compositionsJson);
    return of(ds);
  }
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
    const mockedVectorUtilsService = new HsAddDataVectorUtilsService(null);
    const mockedCommonLaymanService = createMockLaymanService(undefined, {
      getStyleFromUrl: async () => compositionStyleXml,
    });
    const mockedStylerService = jasmine.createSpyObj('HsStylerService', [
      'parseStyle',
    ]);

    const bed = TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      declarations: [HsCompositionsComponent],
      imports: [
        CommonModule,
        HsPanelHelpersModule,
        FormsModule,
        TranslateCustomPipe,
        HsStylerModule,
        NgbDropdownModule,
        HsPanelHeaderComponent,
      ],
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
            mockedVectorUtilsService,
            null,
          ),
        },
        {
          provide: HsCommonEndpointsService,
          useValue: {
            endpoints: signal([]),
          },
        },
        {
          provide: HsCommonLaymanService,
          useValue: mockedCommonLaymanService,
        },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
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
