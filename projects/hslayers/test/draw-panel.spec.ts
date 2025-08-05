import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';
import {provideHttpClientTesting} from '@angular/common/http/testing';
import {TranslatePipe} from '@ngx-translate/core';

import {of} from 'rxjs';
import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';
import {Vector as VectorLayer} from 'ol/layer';
import {Vector as VectorSource} from 'ol/source';

import {
  HsAddDataOwsService,
  HsAddDataVectorService,
  HsLaymanBrowserService,
} from 'hslayers-ng/services/add-data';
import {HsCommonEndpointsService} from 'hslayers-ng/services/endpoints';
import {HsCommonLaymanService} from 'hslayers-ng/common/layman';
import {HsConfig} from 'hslayers-ng/config';
import {HsConfigMock} from './config.service.mock';
import {HsDrawPanelComponent} from 'hslayers-ng/components/draw';
import {HsDrawService} from 'hslayers-ng/services/draw';
import {HsLanguageService} from 'hslayers-ng/services/language';
import {HsLaymanService} from 'hslayers-ng/services/save-map';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {HsLayoutServiceMock} from './layout.service.mock';
import {HsMapService} from 'hslayers-ng/services/map';
import {HsMapServiceMock} from './map.service.mock';
import {
  HsQueryBaseService,
  HsQueryVectorService,
} from 'hslayers-ng/services/query';
import {createMockLaymanService} from './common/layman/layman.service.mock';
class emptyMock {
  constructor() {}
}

class HsQueryVectorMock {
  constructor() {}
}

class LaymanBrowserServiceMock {
  constructor() {}
  queryCatalog() {
    return of([]);
  }
}

describe('HsDrawPanel', () => {
  const mockQueryBaseService = jasmine.createSpyObj('HsQueryBaseService', [
    'activateQueries',
    'deactivateQueries',
    'data',
  ]);
  const mockLaymanService = {
    ...jasmine.createSpyObj('HsLaymanService', ['']),
    laymanLayerPending: of([]),
  };
  const mockHsCommonEndpointsService = {
    ...jasmine.createSpyObj('HsCommonEndpointsService', ['fillEndpoints']),
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
      },
    );
  });

  let fixture: ComponentFixture<HsDrawPanelComponent>;
  let component: HsDrawPanelComponent;
  let service: HsDrawService;
  beforeEach(() => {
    const mockedConfig = new HsConfigMock();

    const mockedCommonLaymanService = createMockLaymanService(undefined, {});

    TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [
        FormsModule,
        TranslatePipe,
        NgbDropdownModule,
        HsDrawPanelComponent,
      ],
      providers: [
        HsDrawService,
        HsLanguageService,
        {
          provide: HsLayoutService,
          useValue: new HsLayoutServiceMock(mockedConfig),
        },
        {provide: HsMapService, useValue: new HsMapServiceMock()},
        {provide: HsConfig, useValue: mockedConfig},
        {provide: HsQueryBaseService, useValue: mockQueryBaseService},
        {provide: HsQueryVectorService, useValue: new HsQueryVectorMock()},
        {provide: HsLaymanService, useValue: mockLaymanService},
        {
          provide: HsCommonEndpointsService,
          useValue: mockHsCommonEndpointsService,
        },
        {
          provide: HsLaymanBrowserService,
          useValue: new LaymanBrowserServiceMock(),
        },
        {provide: HsAddDataOwsService, useValue: new emptyMock()},
        {provide: HsAddDataVectorService, useValue: new emptyMock()},
        {
          provide: HsCommonLaymanService,
          useValue: mockedCommonLaymanService,
        },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }); //.compileComponents();
    fixture = TestBed.createComponent(HsDrawPanelComponent);
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
