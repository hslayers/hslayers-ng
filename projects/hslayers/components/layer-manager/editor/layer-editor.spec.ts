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

import {HsAddDataOwsService} from 'hslayers-ng/components/add-data';
import {
  HsArcgisGetCapabilitiesService,
  HsWfsGetCapabilitiesService,
  HsWmsGetCapabilitiesService,
  HsWmtsGetCapabilitiesService,
} from 'hslayers-ng/shared/get-capabilities';
import {HsClusterWidgetComponent} from '../widgets/cluster-widget.component';
import {HsConfig} from 'hslayers-ng/config';
import {HsConfigMock} from 'hslayers-ng/config';
import {HsDrawService} from 'hslayers-ng/components/draw';
import {HsLanguageModule} from 'hslayers-ng/components/language';
import {HsLayerEditorComponent} from './layer-editor.component';
import {HsLayerEditorService} from './layer-editor.service';
import {HsLayerEditorSublayerService} from './layer-editor-sub-layer.service';
import {HsLayerEditorVectorLayerService} from './layer-editor-vector-layer.service';
import {HsLayerUtilsService} from 'hslayers-ng/shared/utils';
import {HsLayoutService} from 'hslayers-ng/components/layout';
import {HsLayoutServiceMock} from 'hslayers-ng/components/layout';
import {HsMapService} from 'hslayers-ng/components/map';
import {HsMapServiceMock} from 'hslayers-ng/components/map';
import {HsPanelHelpersModule} from 'hslayers-ng/components/layout';
import {HsShareUrlService} from 'hslayers-ng/components/share';
import {HsStylerService} from 'hslayers-ng/components/styler';
import {HsStylerServiceMock} from 'hslayers-ng/components/styler';
import {HsUtilsService} from 'hslayers-ng/shared/utils';
import {HsUtilsServiceMock} from 'hslayers-ng/shared/utils';
import {getCluster} from 'hslayers-ng/common/extensions';
import {mockLayerUtilsService} from 'hslayers-ng/shared/utils';

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
        {provide: HsConfig, useValue: mockedConfig},
        {
          provide: HsLayoutService,
          useValue: new HsLayoutServiceMock(mockedConfig),
        },
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
