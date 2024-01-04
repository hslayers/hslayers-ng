import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {Subject} from 'rxjs';

import {Map} from 'ol';
import {Vector as VectorLayer} from 'ol/layer';

import {HsCommonEndpointsService} from 'hslayers-ng/shared/endpoints';
import {HsCommonLaymanService} from 'hslayers-ng/common/layman';
import {HsConfig} from 'hslayers-ng/config';
import {HsConfigMock} from 'hslayers-ng/config';
import {HsDialogContainerService} from 'hslayers-ng/common/dialogs';
import {HsEndpoint} from 'hslayers-ng/shared/endpoints';
import {HsEventBusService} from 'hslayers-ng/shared/core';
import {HsLayerUtilsService} from 'hslayers-ng/shared/utils';
import {HsLaymanService} from './layman.service';
import {HsLayoutService} from 'hslayers-ng/shared/layout';
import {HsLayoutServiceMock} from 'hslayers-ng/shared/layout';
import {HsMapService} from 'hslayers-ng/components/map';
import {HsMapServiceMock} from 'hslayers-ng/components/map';
import {HsSaveMapComponent} from './save-map.component';
import {HsSaveMapDialogSpawnerService} from './dialog-spawner.service';
import {HsSaveMapManagerService} from './save-map-manager.service';
import {HsSaveMapManagerServiceMock} from './save-map-manager.service.mock';
import {HsUtilsService} from 'hslayers-ng/shared/utils';
import {HsUtilsServiceMock} from 'hslayers-ng/shared/utils';
import {TranslateCustomPipe} from 'hslayers-ng/shared/language';
import {
  getLayerName,
  getLaymanFriendlyLayerName,
} from 'hslayers-ng/common/layman';
import {mockLayerUtilsService} from 'hslayers-ng/shared/utils';

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
  layoutLoads: Subject<any> = new Subject();
  layoutResizes: Subject<any> = new Subject();
  updateMapSize: Subject<any> = new Subject();
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
      imports: [
        FormsModule,
        HttpClientTestingModule,
        HttpClientTestingModule,
        TranslateCustomPipe,
      ],
      declarations: [HsSaveMapComponent],
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
