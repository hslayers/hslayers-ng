import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormsModule} from '@angular/forms';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {TranslateModule} from '@ngx-translate/core';

import VectorLayer from 'ol/layer/Vector';
import {Vector as VectorSource} from 'ol/source';

import {HsConfig} from '../../config.service';
import {HsDrawService} from '../draw/draw.service';
import {HsLayerEditorComponent} from './layer-editor.component';
import {HsLayerEditorService} from './layer-editor.service';
import {HsLayerEditorSublayerService} from './layer-editor.sub-layer.service';
import {HsLayerEditorVectorLayerService} from './layer-editor-vector-layer.service';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsLayerUtilsServiceMock} from '../utils/layer-utils.service.mock';
import {HsLayoutService} from '../layout/layout.service';
import {HsMapService} from '../map/map.service';
import {HsMapServiceMock} from '../map/map.service.mock';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';
import {HsShareUrlService} from '../permalink/share-url.service';
import {HsStylerService} from './../styles/styler.service';
import {HsStylerServiceMock} from './../styles/styler.service.mock';
import {HsUtilsService} from '../utils/utils.service';
import {HsUtilsServiceMock} from '../utils/utils.service.mock';
import {HsWfsGetCapabilitiesService} from '../../common/wfs/get-capabilities.service';
import {HsWmsGetCapabilitiesService} from '../../common/wms/get-capabilities.service';
import {HsWmtsGetCapabilitiesService} from '../../common/wmts/get-capabilities.service';
import { getCluster } from '../../common/layer-extensions';

class HsConfigMock {
  reverseLayerList = true;
  layersInFeatureTable = [];
  constructor() {}
}

class emptyMock {
  constructor() {}
}

describe('layermanager', () => {
  let component: HsLayerEditorComponent;
  let fixture: ComponentFixture<HsLayerEditorComponent>;

  const layerForCluster = new VectorLayer({
    title: 'Bookmarks',
    source: new VectorSource({}),
  });

  beforeAll(() => {
    TestBed.resetTestEnvironment();
    TestBed.initTestEnvironment(
      BrowserDynamicTestingModule,
      platformBrowserDynamicTesting()
    );
  });

  beforeEach(() => {
    const bed = TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [
        HsPanelHelpersModule,
        FormsModule,
        NgbModule,
        TranslateModule.forRoot(),
      ],
      declarations: [HsLayerEditorComponent],
      providers: [
        HsLayerEditorSublayerService,
        HsLayerEditorService,
        HsLayerEditorVectorLayerService,
        {provide: HsWmtsGetCapabilitiesService, useValue: new emptyMock()},
        {
          provide: HsShareUrlService,
          useValue: {
            getParamValue: () => undefined,
          },
        },
        {provide: HsWmsGetCapabilitiesService, useValue: new emptyMock()},
        {provide: HsWfsGetCapabilitiesService, useValue: new emptyMock()},
        {provide: HsUtilsService, useValue: new HsUtilsServiceMock()},
        {provide: HsLayerUtilsService, useValue: new HsLayerUtilsServiceMock()},
        {provide: HsStylerService, useValue: new HsStylerServiceMock()},
        {provide: HsDrawService, useValue: new emptyMock()},
        {provide: HsMapService, useValue: new HsMapServiceMock()},
        {provide: HsConfig, useValue: new HsConfigMock()},
        {provide: HsLayoutService, useValue: new emptyMock()},
      ],
    });
    //bed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HsLayerEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    component.currentLayer = {layer: layerForCluster};
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('clusterization', () => {
    component.cluster = true;
    expect(getCluster(layerForCluster)).toBe(true);
    expect(layerForCluster.getSource().getSource).toBeDefined();

    component.distance.value = 15;
    component.changeDistance();
    expect(layerForCluster.getSource().getDistance()).toBe(15);

    //Turn clusterization off
    component.cluster = false;
    expect(getCluster(layerForCluster)).toBe(false);
    expect(layerForCluster.getSource().getSource).toBeUndefined();
  });
});
