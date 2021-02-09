/* eslint-disable prefer-arrow-callback */
'use strict';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {HsAddDataVectorService} from '../add-data/vector/add-data-vector.service';
import {HsCommonEndpointsService} from '../../common/endpoints/endpoints.service';
import {HsCompositionsCatalogueService} from './compositions-catalogue.service';
import {HsCompositionsComponent} from './compositions.component';
import {HsCompositionsLayerParserService} from './layer-parser/layer-parser.service';
import {HsCompositionsMickaService} from './endpoints/compositions-micka.service';
import {HsCompositionsService} from './compositions.service';
import {HsCompositionsStatusManagerService} from './endpoints/compositions-status-manager.service';
import {HsConfig} from '../../config.service';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsMapService} from '../map/map.service';
import {HsMapServiceMock} from '../map/map.service.mock';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';
import {HsSaveMapService} from '../save-map/save-map.service';
import {HsStylerModule} from '../styles/styles.module';
import {HsStylerService} from '../styles/styler.service';
import {HsUtilsService} from '../utils/utils.service';
import {HsUtilsServiceMock} from '../utils/utils.service.mock';
import {HttpClientModule} from '@angular/common/http';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {TranslateModule} from '@ngx-translate/core';
import {compositionJson} from '../../../test/data/composition';
import {compositionsJson} from '../../../test/data/compositions';
import {getTitle} from '../../common/layer-extensions';
class HsConfigMock {
  reverseLayerList = true;
  constructor() {}
}

class emptyMock {
  constructor() {}
}

let mockedMapService;
let CompositionsCatalogueService;
describe('compositions', () => {
  let component: HsCompositionsComponent;
  let fixture: ComponentFixture<HsCompositionsComponent>;

  beforeAll(() => {
    TestBed.resetTestEnvironment();
    TestBed.initTestEnvironment(
      BrowserDynamicTestingModule,
      platformBrowserDynamicTesting()
    );
  });

  beforeEach(() => {
    mockedMapService = new HsMapServiceMock();
    const mockedUtilsService: any = new HsUtilsServiceMock();
    const bed = TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [
        CommonModule,
        HttpClientModule,
        HsPanelHelpersModule,
        FormsModule,
        TranslateModule.forRoot(),
        HsStylerModule,
        NgbModule,
      ],
      declarations: [HsCompositionsComponent],
      providers: [
        HsCompositionsService,
        HsCompositionsCatalogueService,
        {
          HsSaveMapService,
          useValue: {
            internalLayers: [],
          },
        },
        {provide: HsUtilsService, useValue: mockedUtilsService},
        {provide: HsMapService, useValue: mockedMapService},
        {provide: HsConfig, useValue: new HsConfigMock()},
        {
          provide: HsLayoutService,
          useValue: {
            contentWrapper: document.createElement('div'),
          },
        },
        {provide: HsLayerUtilsService, useValue: new emptyMock()},
        HsStylerService,
        HsCompositionsLayerParserService,
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
            new HsStylerService(null, mockedUtilsService, null),
            null
          ),
        },
        {
          provide: HsCommonEndpointsService,
          useValue: {
            endpoints: [],
          },
        },
      ],
    });
    const hsCompositionsMickaService = TestBed.get(HsCompositionsMickaService);
    //Mock server response
    hsCompositionsMickaService.getCompositions = () => {
      return new Promise((resolve, reject) => {
        resolve(compositionsJson);
      });
    };
    CompositionsCatalogueService = TestBed.inject(
      HsCompositionsCatalogueService
    );
  });

  beforeEach(() => {
    spyOn(window.console, 'error');
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
  });

  /**
   * @param scope
   * @param component
   */
  function loadComposition(component) {
    component.HsCompositionsParserService.loadCompositionObject(
      compositionJson,
      true
    );
  }

  it('should load composition from json', function () {
    loadComposition(component);
    expect(mockedMapService.map.getLayers().getLength()).toBe(4);
    expect(getTitle(mockedMapService.map.getLayers().item(0))).toBe(
      'Measurement sketches'
    );
  });

  it('if should parse composition layer style', function () {
    loadComposition(component);
    expect(mockedMapService.map.getLayers().item(0).getStyle()).toBeDefined();
  });
});
