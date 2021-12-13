import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';
import {of} from 'rxjs';

import VectorLayer from 'ol/layer/Vector';
import {Polygon} from 'ol/geom';
import {Vector as VectorSource} from 'ol/source';

import {DrawPanelComponent} from './draw-panel.component';
import {HsAddDataVectorService} from '../../add-data/vector/vector.service';
import {HsCommonLaymanService} from '../../../common/layman/layman.service';
import {HsConfig} from '../../../config.service';
import {HsDrawService} from '../draw.service';
import {HsLanguageService} from '../../language/language.service';
import {HsLayerUtilsService} from '../../utils/layer-utils.service';
import {HsLaymanBrowserService} from '../../add-data/catalogue/layman/layman.service';
import {HsLaymanService} from '../../save-map/layman.service';
import {HsLayoutService} from '../../layout/layout.service';
import {HsMapService} from '../../map/map.service';
import {HsMapServiceMock} from '../../map/map.service.mock';
import {HsQueryBaseService} from '../../query/query-base.service';
import {HsQueryVectorService} from '../../query/query-vector.service';
import {HsUtilsService} from '../../utils/utils.service';
import {HsUtilsServiceMock} from '../../utils/utils.service.mock';
import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';
import {mockLayerUtilsService} from '../../utils/layer-utils.service.mock';

class emptyMock {
  constructor() {}
}
class HsConfigMock {
  constructor() {}
}

class HsQueryVectorMock {
  constructor() {}
}

describe('HsDrawPanel', () => {
  const mockLayoutService = jasmine.createSpyObj('HsLayoutService', [
    'sidebarBottom',
    'panelVisible',
  ]);
  const mockQueryBaseService = jasmine.createSpyObj('HsQueryBaseService', [
    'activateQueries',
    'deactivateQueries',
    'data',
  ]);
  const mockLaymanService = {
    ...jasmine.createSpyObj('HsLaymanService', ['getLaymanEndpoint']),
    laymanLayerPending: of([]),
  };
  const mockLanguageService = jasmine.createSpyObj('HsLanguageService', [
    'getTranslation',
    'getTranslationIgnoreNonExisting',
  ]);
  const layer = new VectorLayer({
    properties: {title: 'Point'},
    source: new VectorSource({}),
  });

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

  let fixture: ComponentFixture<DrawPanelComponent>;
  let component: DrawPanelComponent;
  let service: HsDrawService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [FormsModule, TranslateModule.forRoot(), NgbDropdownModule],
      declarations: [DrawPanelComponent],
      providers: [
        HsDrawService,
        {provide: HsLayoutService, useValue: mockLayoutService},
        {provide: HsLanguageService, useValue: mockLanguageService},
        {provide: HsMapService, useValue: new HsMapServiceMock()},
        {provide: HsLayerUtilsService, useValue: mockLayerUtilsService()},
        {provide: HsConfig, useValue: new HsConfigMock()},
        {provide: HsQueryBaseService, useValue: mockQueryBaseService},
        {provide: HsQueryVectorService, useValue: new HsQueryVectorMock()},
        {provide: HsLaymanService, useValue: mockLaymanService},
        {provide: HsLaymanBrowserService, useValue: new emptyMock()},
        {provide: HsAddDataVectorService, useValue: new emptyMock()},
        {provide: HsUtilsService, useValue: new HsUtilsServiceMock()},
        {
          provide: HsCommonLaymanService,
          useValue: {
            authChange: of('endpoint'),
          },
        },
      ],
    }); //.compileComponents();
    fixture = TestBed.createComponent(DrawPanelComponent);
    service = TestBed.inject(HsDrawService);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('Draw component should be available', () => {
    expect(component).toBeTruthy();
  });

  it('Activate drawing', () => {
    spyOn(service, 'activateDrawing');

    component.setType('polygon');

    expect(service.tmpDrawLayer).toBeDefined();
    expect(service.type).toBe('polygon');
    expect(service.selectedLayer).toBeDefined();
    expect(service.activateDrawing).toHaveBeenCalled();
  });

  it('Select layer', () => {
    component.selectLayer(layer);
    expect(service.source).toBeDefined();
  });
});
