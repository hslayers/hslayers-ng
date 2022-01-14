import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';
import {TranslateModule} from '@ngx-translate/core';

import {Image as ImageLayer, Tile, Vector as VectorLayer} from 'ol/layer';
import {ImageWMS, Vector as VectorSource} from 'ol/source';

import {HsAddDataOwsService} from '../../add-data/url/add-data-ows.service';
import {HsArcgisGetCapabilitiesService} from '../../../common/get-capabilities/arcgis-get-capabilities.service';
import {HsConfig} from '../../../config.service';
import {HsDrawService} from '../../draw/draw.service';
import {HsLayerListComponent} from './layermanager-layerlist.component';
import {HsLayerManagerService} from '../layermanager.service';
import {HsLayerUtilsService} from '../../utils/layer-utils.service';
import {HsLayoutService} from '../../layout/layout.service';
import {HsMapService} from '../../map/map.service';
import {HsMapServiceMock} from '../../map/map.service.mock';
import {HsPanelHelpersModule} from '../../layout/panels/panel-helpers.module';
import {HsShareUrlService} from '../../permalink/share-url.service';
import {HsUtilsService} from '../../utils/utils.service';
import {HsUtilsServiceMock} from '../../utils/utils.service.mock';
import {HsWfsGetCapabilitiesService} from '../../../common/get-capabilities/wfs-get-capabilities.service';
import {HsWmsGetCapabilitiesService} from '../../../common/get-capabilities/wms-get-capabilities.service';
import {HsWmtsGetCapabilitiesService} from '../../../common/get-capabilities/wmts-get-capabilities.service';
import {mockLayerUtilsService} from '../../utils/layer-utils.service.mock';
import {wmsGetCapabilitiesResponse} from '../../../../test/data/wms-capabilities';

class HsConfigMock {
  reverseLayerList = true;
  constructor() {}
}

class emptyMock {
  constructor() {}
}

const layerUtilsMock = mockLayerUtilsService();
describe('layermanager-layer-list', () => {
  let component: HsLayerListComponent;
  let fixture: ComponentFixture<HsLayerListComponent>;

  const layerForCluster = new VectorLayer({
    properties: {title: 'Bookmarks'},
    source: new VectorSource({}),
  });

  const params = {'LAYERS': 'BSS', 'TILED': true};
  const subLayerContainerLayer = new ImageLayer({
    properties: {title: 'test'},
    source: new ImageWMS({
      url: 'http://geoservices.brgm.fr/geologie',
      params,
      crossOrigin: 'anonymous',
    }),
  });
  layerUtilsMock.getLayerParams.and.returnValue(params);

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

  beforeEach(() => {
    const bed = TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [
        HsPanelHelpersModule,
        FormsModule,
        NgbDropdownModule,
        TranslateModule.forRoot(),
      ],
      declarations: [HsLayerListComponent],
      providers: [
        HsLayerManagerService,
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
        {provide: HsConfig, useValue: new HsConfigMock()},
        {provide: HsDrawService, useValue: new HsConfigMock()},
        {provide: HsLayoutService, useValue: new emptyMock()},
      ],
    });
    //bed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HsLayerListComponent);
    component = fixture.componentInstance;
    component.folder = {layers: []};
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should list sublayers', () => {
    component['HsLayerManagerService'].layerAdded(
      {
        element: subLayerContainerLayer,
      },
      true
    );
    expect(component).toBeTruthy();
  });
});
