import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {Subject} from 'rxjs';
import {TranslateModule} from '@ngx-translate/core';

import VectorLayer from 'ol/layer/Vector';
import {HsCommonEndpointsService} from '../../common/endpoints/endpoints.service';
import {HsCommonLaymanService} from '../../common/layman/layman.service';
import {HsConfig} from '../../config.service';
import {HsDialogContainerService} from '../layout/dialogs/dialog-container.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLaymanService} from './layman.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsLayoutServiceMock} from '../layout/layout.service.mock';
import {HsMapService} from '../map/map.service';
import {HsMapServiceMock} from '../map/map.service.mock';
import {HsSaveMapComponent} from './save-map.component';
import {HsSaveMapDialogSpawnerService} from './dialog-spawner.service';
import {HsSaveMapManagerService} from './save-map-manager.service';
import {HsUtilsService} from '../utils/utils.service';
import {HsUtilsServiceMock} from '../utils/utils.service.mock';
import {getLayerName, getLaymanFriendlyLayerName} from './layman-utils';

class emptyMock {
  constructor() {}
}
class HsSaveMapManagerServiceMock {
  constructor() {}
  panelOpened: Subject<any> = new Subject();
  endpointSelected: Subject<any> = new Subject();
}

class HsCommonLaymanServiceMock {
  constructor() {}
  authChange: Subject<any> = new Subject();
}

class HsEventBusServiceMock {
  constructor() {}
  compositionLoads: Subject<any> = new Subject();
  mapResets: Subject<any> = new Subject();
  mainPanelChanges: Subject<any> = new Subject();
  olMapLoads: Subject<any> = new Subject();
  layoutLoads: Subject<any> = new Subject();
}

class CommonEndpointsServiceMock {
  constructor() {}
  endpointsFilled: Subject<any> = new Subject();
}

describe('HsSaveMap', () => {
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

  let fixture: ComponentFixture<HsSaveMapComponent>;
  let component: HsSaveMapComponent;
  let service: HsLaymanService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [
        FormsModule,
        TranslateModule.forRoot(),
        HttpClientTestingModule,
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
        {provide: HsConfig, useValue: new emptyMock()},
        {
          provide: HsCommonEndpointsService,
          useValue: new CommonEndpointsServiceMock(),
        },
        {
          provide: HsSaveMapDialogSpawnerService,
          useValue: new emptyMock(),
        },
        {provide: HsDialogContainerService, useValue: new emptyMock()},
        {provide: HsLayoutService, useValue: new HsLayoutServiceMock()},
        {
          provide: HsCommonLaymanService,
          useValue: new HsCommonLaymanServiceMock(),
        },
        {provide: HsMapService, useValue: new HsMapServiceMock()},
        {provide: HsUtilsService, useValue: new HsUtilsServiceMock()},
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
    expect(laymanName).toBe('some_czech_name_like_vn_hust_nzev');
  });

  it('read layer title/name attributes and escape for layman', () => {
    let laymanName = getLayerName(
      new VectorLayer({properties: {title: 'Areas of interest'}})
    );
    expect(laymanName).toBe('areas_of_interest');

    laymanName = getLayerName(
      new VectorLayer({properties: {name: 'Aoi', title: 'Areas of interest'}})
    );
    expect(laymanName).toBe('aoi');
  });
});
