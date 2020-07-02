/* eslint-disable prefer-arrow-callback */
/* eslint-disable angular/no-service-method */
/* eslint-disable angular/di */
'use strict';
import VectorLayer from 'ol/layer/Vector';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HsMapService } from '../map/map.service';
import { Vector as VectorSource } from 'ol/source';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { HsPanelHelpersModule } from '../layout/panel-helpers.module';
import { HsLayerEditorComponent } from './layer-editor.component';
import { HsLayerEditorSublayerService } from './layer-editor.sub-layer.service';
import { HsLayerEditorService } from './layer-editor.service';
import { HsLayerEditorVectorLayerService } from './layer-editor-vector-layer.service';
import { FormsModule } from '@angular/forms';
import { HsUtilsService } from '../utils/utils.service';
import { HsUtilsServiceMock } from '../utils/utils.service.mock';
import { HsLayerUtilsService } from '../utils/layer-utils.service';
import { HsLayerUtilsServiceMock } from '../utils/layer-utils.service.mock';
import { HsStylerService } from '../styles/styler.service';
import { HsMapServiceMock } from '../map/map.service.mock';
import { HsConfig } from '../../config.service';
import {HsWmtsGetCapabilitiesService} from '../../common/wmts/get-capabilities.service.js'
import {HsWmsGetCapabilitiesService} from '../../common/wms/get-capabilities.service.js'
import {HsWfsGetCapabilitiesService} from '../../common/wfs/get-capabilities.service.js'
import { HsLayoutService } from '../layout/layout.service';
import { HsDrawService } from '../draw/draw.service';

class HsConfigMock {
  constructor(){}
}

class emptyMock {
  constructor (){}
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
    TestBed.initTestEnvironment(BrowserDynamicTestingModule,
      platformBrowserDynamicTesting());
  });

  beforeEach(() => {
    const bed = TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [HsPanelHelpersModule, FormsModule],
      declarations: [HsLayerEditorComponent],
      providers: [
        HsLayerEditorSublayerService,
        HsLayerEditorService,
        HsLayerEditorVectorLayerService,
        { provide: HsWmtsGetCapabilitiesService, useValue: new emptyMock() },
        { provide: HsWmsGetCapabilitiesService, useValue: new emptyMock() },
        { provide: HsWfsGetCapabilitiesService, useValue: new emptyMock() },
        { provide: HsUtilsService, useValue: new HsUtilsServiceMock() },
        { provide: HsLayerUtilsService, useValue: new HsLayerUtilsServiceMock() },
        { provide: HsStylerService, useValue: new emptyMock() },
        { provide: HsDrawService, useValue: new emptyMock() },
        { provide: HsMapService, useValue: new HsMapServiceMock() },
        { provide: HsConfig, useValue: new HsConfigMock() },
        { provide: HsLayoutService, useValue: new emptyMock() }
      ]
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

    expect(layerForCluster.get('cluster')).toBe(true);
    expect(layerForCluster.getSource().getSource).toBeDefined();

    component.distance.value = 15;
    component.changeDistance();
    expect(layerForCluster.getSource().getDistance()).toBe(15);

    //Turn clusterization off
    component.cluster = false;
    expect(layerForCluster.get('cluster')).toBe(false);
    expect(layerForCluster.getSource().getSource).toBeUndefined();
  });
});
