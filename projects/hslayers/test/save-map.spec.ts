import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import {CUSTOM_ELEMENTS_SCHEMA, signal} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {Subject} from 'rxjs';
import {provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';
import {provideHttpClientTesting} from '@angular/common/http/testing';
import {provideTranslateService, TranslatePipe} from '@ngx-translate/core';

import {Map} from 'ol';
import {Vector as VectorLayer} from 'ol/layer';

import {HsCommonEndpointsService} from 'hslayers-ng/services/endpoints';
import {
  HsCommonLaymanService,
  getLayerName,
  getLaymanFriendlyLayerName,
} from 'hslayers-ng/common/layman';
import {HsConfig} from 'hslayers-ng/config';
import {HsConfigMock} from './config.service.mock';
import {HsDialogContainerService} from 'hslayers-ng/common/dialogs';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsLaymanService} from 'hslayers-ng/services/save-map';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {HsLayoutServiceMock} from './layout.service.mock';
import {HsMapService} from 'hslayers-ng/services/map';
import {HsMapServiceMock} from './map.service.mock';

import {HsSaveMapManagerServiceMock} from './save-map-manager.service.mock';
import {createMockLaymanService} from './common/layman/layman.service.mock';
import {
  HsSaveMapComponent,
  HsSaveMapManagerService,
} from 'hslayers-ng/components/save-map';

class emptyMock {
  constructor() {}
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
  endpoints = signal([]);
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
      imports: [FormsModule, TranslatePipe],
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
        {provide: HsDialogContainerService, useValue: new emptyMock()},
        {
          provide: HsLayoutService,
          useValue: new HsLayoutServiceMock(mockedConfig),
        },
        {
          provide: HsCommonLaymanService,
          useValue: createMockLaymanService(),
        },
        {provide: HsMapService, useValue: new HsMapServiceMock()},
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        provideTranslateService(),
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
