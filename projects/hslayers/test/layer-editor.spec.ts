import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';
import {provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';
import {provideHttpClientTesting} from '@angular/common/http/testing';

import {Cluster, Vector as VectorSource} from 'ol/source';
import {Feature} from 'ol';
import {Vector as VectorLayer} from 'ol/layer';

import {HsAddDataOwsService} from 'hslayers-ng/services/add-data';
import {HsClusterWidgetComponent} from 'hslayers-ng/components/layer-manager';
import {HsConfig} from 'hslayers-ng/config';
import {HsConfigMock} from './config.service.mock';
import {HsLanguageModule} from 'hslayers-ng/components/language';
import {HsLayerEditorComponent} from 'hslayers-ng/components/layer-manager';
import {HsLayerEditorService} from 'hslayers-ng/components/layer-manager';
import {HsLayerEditorVectorLayerService} from 'hslayers-ng/services/layer-manager';
import {HsLayerUtilsService} from 'hslayers-ng/services/utils';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {HsLayoutServiceMock} from './layout.service.mock';
import {HsPanelHelpersModule} from 'hslayers-ng/common/panels';
import {HsShareUrlService} from 'hslayers-ng/services/share';
import {HsStylerService} from 'hslayers-ng/services/styler';
import {HsStylerServiceMock} from './styler.service.mock';
import {HsUtilsService} from 'hslayers-ng/services/utils';
import {HsUtilsServiceMock} from './utils/utils.service.mock';
import {HsWmtsGetCapabilitiesService} from 'hslayers-ng/services/get-capabilities';
import {getCluster} from 'hslayers-ng/common/extensions';
import {mockLayerUtilsService} from './layer-utils.service.mock';

class emptyMock {
  constructor() {}
}

describe('layermanager editor', () => {
  let component: HsLayerEditorComponent;
  let fixture: ComponentFixture<HsLayerEditorComponent>;
  let clusterWidgetComponent: HsClusterWidgetComponent;
  let clusterWidgetFixture: ComponentFixture<HsClusterWidgetComponent>;
  let layerForCluster;
  let hsConfig: HsConfig;
  beforeAll(() => {
    layerForCluster = new VectorLayer({
      properties: {
        title: 'Bookmarks',
      },
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

  beforeEach(() => {
    const mockedConfig = new HsConfigMock();

    const bed = TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      declarations: [HsClusterWidgetComponent],
      imports: [
        HsPanelHelpersModule,
        FormsModule,
        NgbDropdownModule,
        HsLanguageModule,
        HsLayerEditorComponent,
      ],
      providers: [
        HsLayerEditorService,
        HsLayerEditorVectorLayerService,
        {provide: HsWmtsGetCapabilitiesService, useValue: new emptyMock()},
        {provide: HsAddDataOwsService, useValue: new emptyMock()},
        {
          provide: HsShareUrlService,
          useValue: {
            getParamValue: () => undefined,
          },
        },
        {provide: HsUtilsService, useValue: new HsUtilsServiceMock()},
        {
          provide: HsLayerUtilsService,
          useValue: mockLayerUtilsService(),
        },
        {provide: HsStylerService, useValue: new HsStylerServiceMock()},
        {provide: HsConfig, useValue: mockedConfig},
        {
          provide: HsLayoutService,
          useValue: new HsLayoutServiceMock(mockedConfig),
        },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });
    //bed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HsLayerEditorComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('layer', {
      layer: layerForCluster,
      idString() {
        return 'layerteststringid';
      },
    });

    hsConfig = TestBed.inject(HsConfig);
    clusterWidgetFixture = TestBed.createComponent(HsClusterWidgetComponent);
    clusterWidgetFixture.componentInstance.data = {};
    clusterWidgetComponent = clusterWidgetFixture.componentInstance;
    clusterWidgetComponent.ngOnInit();

    fixture.detectChanges();

    clusterWidgetComponent.layerDescriptor.next({layer: layerForCluster});
    hsConfig.reverseLayerList = true;
    hsConfig.layersInFeatureTable = [];
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('clusterization', () => {
    clusterWidgetComponent.cluster = true;
    expect(getCluster(layerForCluster)).toBe(true);
    expect(
      (layerForCluster.getSource() as Cluster<Feature>).getSource,
    ).toBeDefined();

    clusterWidgetComponent.distance.value = 15;
    clusterWidgetComponent.changeDistance();
    expect(
      (layerForCluster.getSource() as Cluster<Feature>).getDistance(),
    ).toBe(15);

    //Turn clusterization off
    clusterWidgetComponent.cluster = false;
    expect(getCluster(layerForCluster)).toBe(false);
    expect(
      (layerForCluster.getSource() as Cluster<Feature>).getSource,
    ).toBeUndefined();
  });
});
