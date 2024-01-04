import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {HttpClientTestingModule} from '@angular/common/http/testing';

import {BehaviorSubject, of} from 'rxjs';
import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';
import {Vector as VectorLayer} from 'ol/layer';
import {Vector as VectorSource} from 'ol/source';

import {DrawPanelComponent} from './draw-panel.component';
import {HsAddDataOwsService} from 'hslayers-ng/components/add-data';
import {HsAddDataVectorService} from '../../add-data/vector/vector.service';
import {HsCommonEndpointsService} from 'hslayers-ng/shared/endpoints';
import {HsCommonLaymanService} from 'hslayers-ng/common/layman';
import {HsConfig} from 'hslayers-ng/config';
import {HsConfigMock} from 'hslayers-ng/config';

import {HsLanguageModule} from 'hslayers-ng/components/language';
import {HsLanguageService} from 'hslayers-ng/shared/language';
import {HsLayerUtilsService} from 'hslayers-ng/shared/utils';
import {HsLaymanBrowserService} from '../../add-data/catalogue/layman/layman.service';
import {HsLaymanService} from 'hslayers-ng/components/save-map';
import {HsLayoutService} from 'hslayers-ng/shared/layout';
import {HsLayoutServiceMock} from 'hslayers-ng/shared/layout';
import {HsMapService} from 'hslayers-ng/components/map';
import {HsMapServiceMock} from 'hslayers-ng/components/map';
import {HsQueryBaseService} from '../../query/query-base.service';
import {HsQueryVectorService} from '../../query/query-vector.service';
import {HsUtilsService} from 'hslayers-ng/shared/utils';
import {HsUtilsServiceMock} from 'hslayers-ng/shared/utils';
import {TranslateCustomPipe} from 'hslayers-ng/shared/language';
import {mockLayerUtilsService} from 'hslayers-ng/shared/utils';
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
    ...jasmine.createSpyObj('HsLaymanService', ['']),
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
      },
    );
  });

  let fixture: ComponentFixture<DrawPanelComponent>;
  let component: DrawPanelComponent;
  let service: HsDrawService;
  beforeEach(() => {
    const mockedConfig = new HsConfigMock();

    TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [
        FormsModule,
        TranslateCustomPipe,
        NgbDropdownModule,
        HttpClientTestingModule,
      ],
      declarations: [DrawPanelComponent],
      providers: [
        HsDrawService,
        HsLanguageService,
        {
          provide: HsLayoutService,
          useValue: new HsLayoutServiceMock(mockedConfig),
        },
        {provide: HsMapService, useValue: new HsMapServiceMock()},
        {provide: HsLayerUtilsService, useValue: mockLayerUtilsService()},
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
          useValue: new HsCommonEndpointsServiceMock(),
        },
        {provide: HsAddDataOwsService, useValue: new emptyMock()},
        {provide: HsAddDataVectorService, useValue: new emptyMock()},
        {provide: HsUtilsService, useValue: new HsUtilsServiceMock()},
        {
          provide: HsCommonLaymanService,
          useValue: {
            authChange: of('endpoint'),
            //No layman endpoint available
            layman$: new BehaviorSubject(undefined),
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
