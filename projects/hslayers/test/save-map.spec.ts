import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {Subject} from 'rxjs';
import {provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';
import {provideHttpClientTesting} from '@angular/common/http/testing';

import {Map} from 'ol';
import {Vector as VectorLayer} from 'ol/layer';

import {HsCommonEndpointsService} from 'hslayers-ng/services/endpoints';
import {HsCommonLaymanService} from 'hslayers-ng/common/layman';
import {HsConfig} from 'hslayers-ng/config';
import {HsConfigMock} from './config.service.mock';
import {HsDialogContainerService} from 'hslayers-ng/common/dialogs';
import {HsEndpoint} from 'hslayers-ng/types';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsLayerUtilsService} from 'hslayers-ng/services/utils';
import {HsLaymanService} from 'hslayers-ng/services/save-map';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {HsLayoutServiceMock} from './layout.service.mock';
import {HsMapService} from 'hslayers-ng/services/map';
import {HsMapServiceMock} from './map.service.mock';
import {HsSaveMapComponent} from 'hslayers-ng/components/save-map';
import {HsSaveMapDialogSpawnerService} from 'hslayers-ng/components/save-map';
import {HsSaveMapManagerService} from 'hslayers-ng/components/save-map';
import {HsSaveMapManagerServiceMock} from './save-map-manager.service.mock';
import {HsUtilsService} from 'hslayers-ng/services/utils';
import {HsUtilsServiceMock} from './utils.service.mock';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';
import {
  getLayerName,
  getLaymanFriendlyLayerName,
} from 'hslayers-ng/common/layman';
import {mockLayerUtilsService} from './layer-utils.service.mock';

class emptyMock {
  constructor() {}
}

class HsCommonLaymanServiceMock {
  constructor() {}
  authChange: Subject<any> = new Subject();
}

class HsEventBusServiceMock {
  constructor() {}
  compositionLoads: Subject<{data: any}> = new Subject();
  mapResets: Subject<any> = new Subject();
  mainPanelChanges: Subject<any> = new Subject();
  olMapLoads: Subject<Map> = new Subject();
  layoutResizes: Subject<any> = new Subject();
  mapSizeUpdates: Subject<any> = new Subject();
}

class CommonEndpointsServiceMock {
  constructor() {}
  endpointsFilled: Subject<{endpoints: HsEndpoint[]}> = new Subject();
}

describe('HsSaveMap', () => {
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

  let fixture: ComponentFixture<HsSaveMapComponent>;
  let component: HsSaveMapComponent;
  let service: HsLaymanService;

  beforeEach(() => {
    const mockedConfig = new HsConfigMock();

    TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      declarations: [HsSaveMapComponent],
      imports: [FormsModule, TranslateCustomPipe],
      providers: [
        HsLaymanService,
        {
          provide: HsSaveMapManagerService,
          useValue: new HsSaveMapManagerServiceMock(),
        },
        {
          provide: HsEventBusService,
          useValue: new HsEventBusServiceMock(),
        },
        {provide: HsConfig, useValue: mockedConfig},
        {
          provide: HsCommonEndpointsService,
          useValue: new CommonEndpointsServiceMock(),
        },
        {
          provide: HsSaveMapDialogSpawnerService,
          useValue: jasmine.createSpyObj('HsSaveMapDialogSpawnerService', [
            'init',
          ]),
        },
        {provide: HsDialogContainerService, useValue: new emptyMock()},
        {
          provide: HsLayoutService,
          useValue: new HsLayoutServiceMock(mockedConfig),
        },
        {
          provide: HsCommonLaymanService,
          useValue: new HsCommonLaymanServiceMock(),
        },
        {provide: HsMapService, useValue: new HsMapServiceMock()},
        {provide: HsUtilsService, useValue: new HsUtilsServiceMock()},
        {provide: HsLayerUtilsService, useValue: mockLayerUtilsService()},
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }); //.compileComponents();
    fixture = TestBed.createComponent(HsSaveMapComponent);
    service = TestBed.inject(HsLaymanService);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('format layer name into a Layman-friendly form', () => {
    // Safe value should not be changed
    let name = 'some_safe_name';
    let laymanName = getLaymanFriendlyLayerName(name);
    expect(laymanName).toEqual(name);

    // Capitals should ne lowercased adn spaces replaced with underscores
    name = 'Some Unsafe English Name';
    laymanName = getLaymanFriendlyLayerName(name);
    expect(laymanName).toBe('some_unsafe_english_name');

    // Non-ASCII characters should be omitted
    // and "" should be omitted
    name = 'Some Czech Name Like "Vážně hustý název"';
    laymanName = getLaymanFriendlyLayerName(name);
    expect(laymanName).toBe('some_czech_name_like_vazne_husty_nazev');
  });

  it('read layer title/name attributes and escape for layman', () => {
    let laymanName = getLayerName(
      new VectorLayer({properties: {title: 'Areas of interest'}}),
    );
    expect(laymanName).toBe('areas_of_interest');

    laymanName = getLayerName(
      new VectorLayer({properties: {name: 'Aoi', title: 'Areas of interest'}}),
    );
    expect(laymanName).toBe('aoi');
  });
});
