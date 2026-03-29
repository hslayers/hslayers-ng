import {ComponentFixture, TestBed} from '@angular/core/testing';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';
import {provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';
import {provideHttpClientTesting} from '@angular/common/http/testing';
import {provideTranslateService} from '@ngx-translate/core';

import Cluster from 'ol/source/Cluster';
import Feature from 'ol/Feature';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

import {getCluster} from 'hslayers-ng/common/extensions';
import {HsAddDataOwsService} from 'hslayers-ng/services/add-data';
import {
  HsClusterWidgetComponent,
  HsLayerEditorComponent,
  HsLayerEditorService,
} from 'hslayers-ng/components/layer-manager';
import {HsConfig} from 'hslayers-ng/config';
import {HsConfigMock} from './config.service.mock';
import {HsLayerEditorVectorLayerService} from 'hslayers-ng/services/layer-manager';
import {HsLayerSelectorService} from 'hslayers-ng/services/layer-manager';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {HsLayoutServiceMock} from './layout.service.mock';
import {HsPanelContainerComponent} from 'hslayers-ng/common/panels';
import {HsShareUrlService} from 'hslayers-ng/services/share';
import {HsStylerService} from 'hslayers-ng/services/styler';
import {HsStylerServiceMock} from './styler.service.mock';
import {HsWmtsGetCapabilitiesService} from 'hslayers-ng/services/get-capabilities';

class emptyMock {
  constructor() {}
}

describe('layermanager editor', () => {
  let component: HsLayerEditorComponent;
  let fixture: ComponentFixture<HsLayerEditorComponent>;
  let clusterWidgetComponent: HsClusterWidgetComponent;
  let clusterWidgetFixture: ComponentFixture<HsClusterWidgetComponent>;
  let layerForCluster;
  let layerDescriptor;
  let hsConfig: HsConfig;
  beforeAll(() => {
    layerForCluster = new VectorLayer({
      properties: {
        title: 'Bookmarks',
      },
      source: new VectorSource({}),
    });
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [
        HsPanelContainerComponent,
        FormsModule,
        NgbDropdownModule,
        HsLayerEditorComponent,
        HsClusterWidgetComponent,
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
        {provide: HsStylerService, useValue: new HsStylerServiceMock()},
        {provide: HsConfig, useClass: HsConfigMock},
        {
          provide: HsLayoutService,
          useClass: HsLayoutServiceMock,
        },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        provideTranslateService(),
      ],
    });
    //bed.compileComponents();
  });

  beforeEach(() => {
    layerDescriptor = {
      layer: layerForCluster,
      idString() {
        return 'layerteststringid';
      },
    };

    fixture = TestBed.createComponent(HsLayerEditorComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('layer', layerDescriptor);

    const hsLayerSelectorService = TestBed.inject(HsLayerSelectorService);
    hsLayerSelectorService.currentLayer = layerDescriptor;

    hsConfig = TestBed.inject(HsConfig);
    clusterWidgetFixture = TestBed.createComponent(HsClusterWidgetComponent);
    clusterWidgetFixture.componentInstance.data = {};
    clusterWidgetComponent = clusterWidgetFixture.componentInstance;
    clusterWidgetFixture.detectChanges();

    fixture.detectChanges();
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
