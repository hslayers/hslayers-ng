import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {Layer} from 'ol/layer';
import {Subject} from 'rxjs';
import {TranslateModule, TranslateStore} from '@ngx-translate/core';

import {HsCommonEndpointsService} from '../../common/endpoints/endpoints.service';
import {HsCommonLaymanService} from '../../common/layman/layman.service';
import {HsConfig} from '../../config.service';
import {HsDialogContainerService} from '../layout/dialogs/dialog-container.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLayerSynchronizerService} from './layer-synchronizer.service';
import {HsLaymanService} from './layman.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsMapService} from '../map/map.service';
import {HsMapServiceMock} from '../map/map.service.mock';
import {HsSaveMapComponent} from './save-map.component';
import {HsSaveMapDialogSpawnerService} from './dialog-spawner.service';
import {HsSaveMapManagerService} from './save-map-manager.service';
import {HsUtilsService} from '../utils/utils.service';
import {HsUtilsServiceMock} from '../utils/utils.service.mock';

class emptyMock {
  constructor() {}
}

class HsSaveMapManagerServiceMock {
  constructor() {}
  panelOpened: Subject<any> = new Subject();
  endpointSelected: Subject<any> = new Subject();
}

class HsEventBusServiceMock {
  constructor() {}
  compositionLoads: Subject<any> = new Subject();
  mapResets: Subject<any> = new Subject();
  mainPanelChanges: Subject<any> = new Subject();
  olMapLoads: Subject<any> = new Subject();
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
      platformBrowserDynamicTesting()
    );
  });

  let fixture: ComponentFixture<HsSaveMapComponent>;
  let component: HsSaveMapComponent;
  let service: HsLayerSynchronizerService;

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
        HsLayerSynchronizerService,
        TranslateStore,
        {
          provide: HsSaveMapManagerService,
          useValue: new HsSaveMapManagerServiceMock(),
        },
        {
          provide: HsEventBusService,
          useValue: new HsEventBusServiceMock(),
        },
        {provide: HsLaymanService, useValue: new emptyMock()},
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
        {provide: HsLayoutService, useValue: new emptyMock()},
        {provide: HsCommonLaymanService, useValue: new emptyMock()},
        {provide: HsMapService, useValue: new HsMapServiceMock()},
        {provide: HsUtilsService, useValue: new HsUtilsServiceMock()},
      ],
    }); //.compileComponents();
    fixture = TestBed.createComponent(HsSaveMapComponent);
    service = TestBed.inject(HsLayerSynchronizerService);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('format layer name into a Layman-friendly form', () => {
    // Safe value should not be changed
    let layer = new Layer({});
    layer.set('title', 'some_safe_name');
    let laymanName = service.getLaymanFriendlyLayerName(layer);
    expect(laymanName).toEqual(layer.get('title'));

    // Capitals should ne lowercased adn spaces replaced with underscores
    layer = new Layer({});
    layer.set('title', 'Some Unsafe English Name');
    laymanName = service.getLaymanFriendlyLayerName(layer);
    expect(laymanName).toBe('some_unsafe_english_name');

    // Non-ASCII characters should be replaced by their closest ASCII representations
    // and "" should be ommitted
    layer = new Layer({});
    layer.set('title', 'Some Czech Name Like "Vážně hustý název"');
    laymanName = service.getLaymanFriendlyLayerName(layer);
    expect(laymanName).toBe('some_czech_name_like_vazne_husty_nazev');
  });
});
