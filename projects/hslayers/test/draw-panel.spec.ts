import {ComponentFixture, TestBed} from '@angular/core/testing';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';
import {provideHttpClientTesting} from '@angular/common/http/testing';
import {provideTranslateService, TranslatePipe} from '@ngx-translate/core';

import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';
import {of} from 'rxjs';

import {createMockLaymanService} from './common/layman/layman.service.mock';
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

class emptyMock {
  constructor() {}
}

class HsQueryVectorMock {
  constructor() {}
}

class LaymanBrowserServiceMock {
  queryCatalog = jasmine.createSpy('queryCatalog').and.returnValue(of([]));
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
  });

  let fixture: ComponentFixture<HsDrawPanelComponent>;
  let component: HsDrawPanelComponent;
  let service: HsDrawService;
  let laymanBrowserService: LaymanBrowserServiceMock;
  beforeEach(() => {
    const mockedCommonLaymanService = createMockLaymanService(undefined, {});
    laymanBrowserService = new LaymanBrowserServiceMock();

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
          useClass: HsLayoutServiceMock,
        },
        {provide: HsMapService, useValue: new HsMapServiceMock()},
        {provide: HsConfig, useClass: HsConfigMock},
        {provide: HsQueryBaseService, useValue: mockQueryBaseService},
        {provide: HsQueryVectorService, useValue: new HsQueryVectorMock()},
        {provide: HsLaymanService, useValue: mockLaymanService},
        {
          provide: HsCommonEndpointsService,
          useValue: mockHsCommonEndpointsService,
        },
        {
          provide: HsLaymanBrowserService,
          useValue: laymanBrowserService,
        },
        {provide: HsAddDataOwsService, useValue: new emptyMock()},
        {provide: HsAddDataVectorService, useValue: new emptyMock()},
        {
          provide: HsCommonLaymanService,
          useValue: mockedCommonLaymanService,
        },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        provideTranslateService(),
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

  it('does not query Layman catalog before draw UI requests server layers', async () => {
    await fixture.whenStable();

    expect(laymanBrowserService.queryCatalog).not.toHaveBeenCalled();
  });

  it('queries Layman catalog when server draw layers are explicitly requested', async () => {
    await service.fillDrawableLayers({loadLaymanLayers: true});

    expect(laymanBrowserService.queryCatalog).toHaveBeenCalledOnceWith(
      jasmine.objectContaining({url: 'http://madeupurl'}),
      jasmine.objectContaining({
        onlyMine: true,
        query: {},
      }),
    );
    expect(
      laymanBrowserService.queryCatalog.calls.mostRecent().args[1].limit,
    ).toBe('');
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
