import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {HttpClientTestingModule} from '@angular/common/http/testing';

import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';
import {Vector as VectorLayer} from 'ol/layer';
import {Vector as VectorSource} from 'ol/source';
import {of} from 'rxjs';

import {DrawPanelComponent} from './draw-panel.component';
import {HsAddDataOwsService} from '../../add-data/url/add-data-ows.service';
import {HsAddDataVectorService} from '../../add-data/vector/vector.service';
import {HsCommonEndpointsService} from '../../../common/endpoints/endpoints.service';
import {HsCommonLaymanService} from '../../../common/layman/layman.service';
import {HsConfig} from '../../../config.service';
import {HsConfigMock} from '../../../config.service.mock';
import {HsDrawService} from '../draw.service';
import {HsLanguageModule} from '../../language/language.module';
import {HsLanguageService} from '../../language/language.service';
import {HsLayerUtilsService} from '../../utils/layer-utils.service';
import {HsLaymanBrowserService} from '../../add-data/catalogue/layman/layman.service';
import {HsLaymanService} from '../../save-map/layman.service';
import {HsLayoutService} from '../../layout/layout.service';
import {HsLayoutServiceMock} from '../../layout/layout.service.mock';
import {HsMapService} from '../../map/map.service';
import {HsMapServiceMock} from '../../map/map.service.mock';
import {HsQueryBaseService} from '../../query/query-base.service';
import {HsQueryVectorService} from '../../query/query-vector.service';
import {HsUtilsService} from '../../utils/utils.service';
import {HsUtilsServiceMock} from '../../utils/utils.service.mock';
import {mockLayerUtilsService} from '../../utils/layer-utils.service.mock';
class emptyMock {
  constructor() {}
}

class HsQueryVectorMock {
  constructor() {}
}

class HsCommonEndpointsServiceMock {
  constructor() {}
  fillLayerMetadata() {
    return;
  }
}

describe('HsDrawPanel', () => {
  const mockQueryBaseService = jasmine.createSpyObj('HsQueryBaseService', [
    'activateQueries',
    'deactivateQueries',
    'data',
  ]);
  const mockLaymanService = {
    ...jasmine.createSpyObj('HsLaymanService', ['getLaymanEndpoint']),
    laymanLayerPending: of([]),
  };
  const mockHsCommonEndpointsService = {
    ...jasmine.createSpyObj('HsCommonEndpointsService', ['fillEndpoints']),
    endpointsFilled: of([]),
  };

  let layer;

  beforeAll(() => {
    layer = new VectorLayer({
      properties: {title: 'Point'},
      source: new VectorSource({}),
    });
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
  const app = 'default';
  beforeEach(() => {
    TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [
        FormsModule,
        HsLanguageModule,
        NgbDropdownModule,
        HttpClientTestingModule,
      ],
      declarations: [DrawPanelComponent],
      providers: [
        HsDrawService,
        HsLanguageService,
        {provide: HsLayoutService, useValue: new HsLayoutServiceMock()},
        {provide: HsMapService, useValue: new HsMapServiceMock()},
        {provide: HsLayerUtilsService, useValue: mockLayerUtilsService()},
        {provide: HsConfig, useValue: new HsConfigMock()},
        {provide: HsQueryBaseService, useValue: mockQueryBaseService},
        {provide: HsQueryVectorService, useValue: new HsQueryVectorMock()},
        {provide: HsLaymanService, useValue: mockLaymanService},
        {
          provide: HsCommonEndpointsService,
          useValue: mockHsCommonEndpointsService,
        },
        {
          provide: HsLaymanBrowserService,
          useValue: new HsCommonEndpointsServiceMock(),
        },
        {provice: HsAddDataOwsService, useValue: new emptyMock()},
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
    fixture.componentInstance.app = app;
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

    expect(service.get(app).tmpDrawLayer).toBeDefined();
    expect(service.get(app).type).toBe('polygon');
    expect(service.get(app).selectedLayer).toBeDefined();
    expect(service.activateDrawing).toHaveBeenCalled();
  });

  it('Select layer', () => {
    component.selectLayer(layer);
    expect(service.get(app).source).toBeDefined();
  });
});
