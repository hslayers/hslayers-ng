import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import {CUSTOM_ELEMENTS_SCHEMA, signal} from '@angular/core';
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {HttpClientTestingModule} from '@angular/common/http/testing';

import {Image as ImageLayer} from 'ol/layer';
import {ImageWMS} from 'ol/source';
import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';

import {HsAddDataOwsService} from 'hslayers-ng/services/add-data';
import {
  HsArcgisGetCapabilitiesService,
  HsWfsGetCapabilitiesService,
  HsWmsGetCapabilitiesService,
  HsWmtsGetCapabilitiesService,
} from 'hslayers-ng/services/get-capabilities';
import {HsConfig} from 'hslayers-ng/config';
import {HsConfigMock} from './config.service.mock';
import {
  HsLayerDescriptor,
  HsLayerListComponent,
} from 'hslayers-ng/components/layer-manager';
import {HsLayerListService} from 'hslayers-ng/components/layer-manager';
import {HsLayerManagerService} from 'hslayers-ng/services/layer-manager';
import {HsLayerUtilsService} from 'hslayers-ng/services/utils';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {HsLayoutServiceMock} from './layout.service.mock';
import {HsMapService} from 'hslayers-ng/services/map';
import {HsMapServiceMock} from './map.service.mock';
import {HsPanelHelpersModule} from 'hslayers-ng/common/panels';
import {HsShareUrlService} from 'hslayers-ng/services/share';
import {HsUtilsService} from 'hslayers-ng/services/utils';
import {HsUtilsServiceMock} from './utils.service.mock';

import {
  BehaviorSubject,
  debounce,
  debounceTime,
  filter,
  of,
  pipe,
  share,
  switchMap,
  tap,
  timeout,
} from 'rxjs';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';
import {mockHsLayerListService} from './layer-manager-layerlist.service.mock';
import {mockLayerUtilsService} from './layer-utils.service.mock';
import {wmsGetCapabilitiesResponse} from './data/wms-capabilities';

class emptyMock {
  constructor() {}
}

const HsLayerManagerServiceMock: jasmine.SpyObj<HsLayerManagerService> = {
  ...jasmine.createSpyObj('HsLayerManagerService', [
    'sortLayersByZ',
    'layerAdded',
  ]),
};
const params = {'LAYERS': 'BSS', 'TILED': true};

const layer: HsLayerDescriptor = {
  layer: new ImageLayer({
    properties: {title: 'test', path: 'Other'},
    source: new ImageWMS({
      url: 'http://geoservices.brgm.fr/geologie',
      params,
      crossOrigin: 'anonymous',
    }),
  }),
  showInLayerManager: true,
};

const layer2: HsLayerDescriptor = {
  layer: new ImageLayer({
    properties: {title: 'another layer name', path: 'Other'},
    source: new ImageWMS({
      url: 'http://geoservices.brgm.fr/geologie',
      params,
      crossOrigin: 'anonymous',
    }),
  }),
  showInLayerManager: true,
};

const layerFilter = new BehaviorSubject('');

HsLayerManagerServiceMock.data = {
  filter: layerFilter.pipe(
    switchMap((d) => {
      return of(d);
    }),
    share(),
  ),
  baselayers: [],
  terrainLayers: [],
  layers: [],
  folders: signal(new Map([['other', {layers: [layer, layer2], zIndex: 0}]])),
};

const layerUtilsMock = mockLayerUtilsService();

describe('layermanager-layer-list', () => {
  let component: HsLayerListComponent;
  let fixture: ComponentFixture<HsLayerListComponent>;
  layerUtilsMock.getLayerParams.and.returnValue(params);
  let hsConfig: HsConfig;

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

  beforeEach(() => {
    const mockedConfig = new HsConfigMock();

    const bed = TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [
        HsPanelHelpersModule,
        FormsModule,
        NgbDropdownModule,
        TranslateCustomPipe,
        HttpClientTestingModule,
      ],
      declarations: [HsLayerListComponent],
      providers: [
        {provide: HsLayerListService, useValue: mockHsLayerListService()},
        {provide: HsArcgisGetCapabilitiesService, useValue: new emptyMock()},
        {provide: HsWmtsGetCapabilitiesService, useValue: new emptyMock()},
        {provide: HsAddDataOwsService, useValue: new emptyMock()},
        {
          provide: HsWmsGetCapabilitiesService,
          useValue: {
            request: (service_url) =>
              new Promise((resolve, reject) => {
                resolve({response: wmsGetCapabilitiesResponse});
              }),
          },
        },
        {provide: HsWfsGetCapabilitiesService, useValue: new emptyMock()},
        {provide: HsUtilsService, useValue: new HsUtilsServiceMock()},
        {
          provide: HsUtilsService,
          useValue: new HsUtilsServiceMock(),
        },
        {
          provide: HsLayerUtilsService,
          useValue: layerUtilsMock,
        },
        {provide: HsMapService, useValue: new HsMapServiceMock()},
        {
          provide: HsShareUrlService,
          useValue: {
            getParamValue: () => undefined,
          },
        },
        {provide: HsConfig, useValue: mockedConfig},
        {
          provide: HsLayoutService,
          useValue: new HsLayoutServiceMock(mockedConfig),
        },
        {provide: HsLayerManagerService, useValue: HsLayerManagerServiceMock},
      ],
    });
    //bed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HsLayerListComponent);
    hsConfig = TestBed.inject(HsConfig);

    component = fixture.componentInstance;
    component.folder = 'other';

    hsConfig.reverseLayerList = true;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should list layers', (done) => {
    component.filteredLayers
      .pipe(filter((l) => l.length !== 0))
      .subscribe((l) => {
        expect(l.length).toBe(2);
        done();
      });
  });

  it('should filter out one layer', fakeAsync((done) => {
    layerFilter.next('another');
    tick(1500);
    component['hsLayerManagerService'].data.filter
      .pipe(
        filter((f) => f !== ''),
        switchMap(() => {
          return component.filteredLayers;
        }),
      )
      .subscribe((l) => {
        expect(l.length).toBe(1);
        done();
      });
  }));
});
