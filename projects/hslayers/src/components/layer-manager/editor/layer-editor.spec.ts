import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';

import {Cluster, Vector as VectorSource} from 'ol/source';
import {Vector as VectorLayer} from 'ol/layer';

import {HsAddDataOwsService} from '../../add-data/url/add-data-ows.service';
import {HsArcgisGetCapabilitiesService} from '../../../common/get-capabilities/arcgis-get-capabilities.service';
import {HsClusterWidgetComponent} from '../widgets/cluster-widget.component';
import {HsConfig} from '../../../config.service';
import {HsConfigMock} from '../../../config.service.mock';
import {HsDrawService} from '../../draw/draw.service';
import {HsLanguageModule} from '../../language/language.module';
import {HsLayerEditorComponent} from './layer-editor.component';
import {HsLayerEditorService} from './layer-editor.service';
import {HsLayerEditorSublayerService} from './layer-editor-sub-layer.service';
import {HsLayerEditorVectorLayerService} from './layer-editor-vector-layer.service';
import {HsLayerUtilsService} from '../../utils/layer-utils.service';
import {HsLayoutService} from '../../layout/layout.service';
import {HsLayoutServiceMock} from '../../layout/layout.service.mock';
import {HsMapService} from '../../map/map.service';
import {HsMapServiceMock} from '../../map/map.service.mock';
import {HsPanelHelpersModule} from '../../layout/panels/panel-helpers.module';
import {HsShareUrlService} from '../../share/share-url.service';
import {HsStylerService} from '../../styles/styler.service';
import {HsStylerServiceMock} from '../../styles/styler.service.mock';
import {HsUtilsService} from '../../utils/utils.service';
import {HsUtilsServiceMock} from '../../utils/utils.service.mock';
import {HsWfsGetCapabilitiesService} from '../../../common/get-capabilities/wfs-get-capabilities.service';
import {HsWmsGetCapabilitiesService} from '../../../common/get-capabilities/wms-get-capabilities.service';
import {HsWmtsGetCapabilitiesService} from '../../../common/get-capabilities/wmts-get-capabilities.service';
import {getCluster} from '../../../common/layer-extensions';
import {mockLayerUtilsService} from '../../utils/layer-utils.service.mock';

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
    const bed = TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [
        HsPanelHelpersModule,
        FormsModule,
        NgbDropdownModule,
        HsLanguageModule,
        HttpClientTestingModule,
      ],
      declarations: [HsLayerEditorComponent, HsClusterWidgetComponent],
      providers: [
        HsLayerEditorSublayerService,
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
        {provide: HsWmsGetCapabilitiesService, useValue: new emptyMock()},
        {provide: HsWfsGetCapabilitiesService, useValue: new emptyMock()},
        {provide: HsArcgisGetCapabilitiesService, useValue: new emptyMock()},
        {provide: HsUtilsService, useValue: new HsUtilsServiceMock()},
        {
          provide: HsLayerUtilsService,
          useValue: mockLayerUtilsService(),
        },
        {provide: HsStylerService, useValue: new HsStylerServiceMock()},
        {provide: HsDrawService, useValue: new emptyMock()},
        {provide: HsMapService, useValue: new HsMapServiceMock()},
        {provide: HsConfig, useValue: new HsConfigMock()},
        {provide: HsLayoutService, useValue: new HsLayoutServiceMock()},
      ],
    });
    //bed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HsLayerEditorComponent);
    component = fixture.componentInstance;
    hsConfig = TestBed.inject(HsConfig);
    clusterWidgetFixture = TestBed.createComponent(HsClusterWidgetComponent);
    clusterWidgetFixture.componentInstance.data = {};
    clusterWidgetComponent = clusterWidgetFixture.componentInstance;
    fixture.detectChanges();
    component.currentLayer = {layer: layerForCluster};
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
    expect((layerForCluster.getSource() as Cluster).getSource).toBeDefined();

    clusterWidgetComponent.distance.value = 15;
    clusterWidgetComponent.changeDistance();
    expect((layerForCluster.getSource() as Cluster).getDistance()).toBe(15);

    //Turn clusterization off
    clusterWidgetComponent.cluster = false;
    expect(getCluster(layerForCluster)).toBe(false);
    expect((layerForCluster.getSource() as Cluster).getSource).toBeUndefined();
  });
});
