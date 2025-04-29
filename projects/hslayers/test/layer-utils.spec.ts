import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {TestBed} from '@angular/core/testing';

import {Cluster, ImageWMS, OSM, TileWMS, Vector, WMTS} from 'ol/source';
import {Image as ImageLayer, Tile, Vector as VectorLayer} from 'ol/layer';

import {HsLanguageService} from 'hslayers-ng/services/language';
import {HsMapService} from 'hslayers-ng/services/map';
import {HsMapServiceMock} from './map.service.mock';
import {
  setCluster,
  setEditor,
  setName,
  setShowInLayerManager,
  setTitle,
} from 'hslayers-ng/common/extensions';
import {
  isLayerClustered,
  layerIsStyleable,
  getLayerTitle,
  isLayerVectorLayer,
  getURL,
  hasLayerTitle,
  getLayerName,
  isLayerInManager,
  isLayerDrawable,
  isLayerEditable,
  isLayerWMTS,
  isLayerWMS,
  isLayerQueryable,
} from 'hslayers-ng/services/utils';

function mockLanguageService() {
  return jasmine.createSpyObj('HsLanguageService', [
    'getTranslation',
    'getTranslationIgnoreNonExisting',
    'getTranslator',
    'setLanguage',
    'getCurrentLanguageCode',
    'listAvailableLanguages',
    'awaitTranslation',
  ]);
}

const mockedLanguageService = mockLanguageService();

describe('HsLayerUtilsService', () => {
  let vectorLayer;
  let tileWMSLayer;
  let imageWMSLayer;
  let tileOSMLayer;
  let tileWMTSLayer;
  let imageWMSNoParams;
  beforeAll(() => {
    vectorLayer = new VectorLayer({
      properties: {title: 'vectorLayer'},
      source: new Vector(),
    });
    tileWMSLayer = new Tile({
      properties: {title: 'tileWMSLayer'},
      source: new TileWMS({
        params: {
          INFO_FORMAT: undefined,
        },
      }),
    });
    imageWMSLayer = new ImageLayer({
      properties: {title: 'imageWMSLayer'},
      source: new ImageWMS({
        url: 'http://example',
        params: {INFO_FORMAT: 'application/json'},
      }),
    });
    tileOSMLayer = new Tile({
      properties: {title: 'tileOSMLayer'},
      source: new OSM(),
    });
    tileWMTSLayer = new Tile({
      properties: {
        title: 'tileWMTSLayer',
      },
      source: new WMTS({
        url: 'https://openlayers.org/en/latest/examples/wmts.html',
      } as any),
    });
    imageWMSNoParams = new ImageLayer({
      source: new ImageWMS({params: {}, url: 'http://example'}),
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
    TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        {provide: HsMapService, useValue: new HsMapServiceMock()},
        {
          provide: HsLanguageService,
          useValue: mockedLanguageService,
        },
      ],
    });
  });

  it('check if layer is clustered', () => {
    const source = new Vector();
    vectorLayer.setSource(new Cluster({source: source}));
    setCluster(vectorLayer, true);
    let isClustered = isLayerClustered(vectorLayer);
    expect(isClustered).toBe(true);
    vectorLayer.setSource(source);
    setCluster(vectorLayer, false);
    isClustered = isLayerClustered(vectorLayer);
    expect(isClustered).toBe(false);
  });
  it('check if layer is stylable', () => {
    let isStylable = layerIsStyleable(vectorLayer);
    expect(isStylable).toBe(true);
    isStylable = layerIsStyleable(tileWMSLayer);
    expect(isStylable).toBe(false);
  });
  it('check if layer is queryable', () => {
    let isQueryable = isLayerQueryable(tileWMSLayer);
    expect(isQueryable).toBe(false);
    isQueryable = isLayerQueryable(imageWMSLayer);
    expect(isQueryable).toBe(true);
    isQueryable = isLayerQueryable(imageWMSNoParams);
    expect(isQueryable).toBe(false);
  });
  it('try to get layer title', () => {
    let layerTitle = getLayerTitle(tileWMSLayer);
    expect(layerTitle).toEqual('tileWMSLayer');
    setTitle(vectorLayer, '&#47;vectorLayer');
    layerTitle = getLayerTitle(vectorLayer);
    expect(layerTitle).toEqual('/vectorLayer');
    layerTitle = getLayerTitle(imageWMSNoParams);
    expect(layerTitle).toEqual('Void');
  });
  it('check if layer is WMS', () => {
    let isWMS = isLayerWMS(tileWMSLayer);
    expect(isWMS).toBe(true);
    isWMS = isLayerWMS(tileOSMLayer);
    expect(isWMS).toBe(false);
    isWMS = isLayerWMS(imageWMSLayer);
    expect(isWMS).toBe(true);
    isWMS = isLayerWMS(vectorLayer);
    expect(isWMS).toBe(false);
  });
  it('check if layer is WMTS', () => {
    let isWMTS = isLayerWMTS(tileWMTSLayer);
    expect(isWMTS).toBe(true);
    isWMTS = isLayerWMTS(tileOSMLayer);
    expect(isWMTS).toBe(false);
  });
  it('check if layer is vectorLayer', () => {
    let isVectorLayer = isLayerVectorLayer(vectorLayer);
    expect(isVectorLayer).toBe(true);
    vectorLayer.setSource(new Cluster({source: new Vector()}));
    isVectorLayer = isLayerVectorLayer(vectorLayer);
    expect(isVectorLayer).toBe(true);
    isVectorLayer = isLayerVectorLayer(imageWMSLayer);
    expect(isVectorLayer).toBe(false);
  });
  it('try to get layer single tile url or multiple tile url', () => {
    let layerUrl = getURL(tileWMTSLayer);

    expect(layerUrl).toEqual(
      'https://openlayers.org/en/latest/examples/wmts.html',
    );
    layerUrl = getURL(tileOSMLayer);
    expect(layerUrl).toEqual('https://tile.openstreetmap.org/{z}/{x}/{y}.png');
  });
  it('check if layer is in LayerManager', () => {
    setShowInLayerManager(tileWMTSLayer, true);
    setShowInLayerManager(tileOSMLayer, false);
    let isInManager = isLayerInManager(tileWMTSLayer);
    expect(isInManager).toBe(true);
    isInManager = isLayerInManager(tileOSMLayer);
    expect(isInManager).toBe(false);
  });
  it('check if layer has title', () => {
    let layerHasTitle = hasLayerTitle(tileWMTSLayer);
    expect(layerHasTitle).toBe(true);
    layerHasTitle = hasLayerTitle(imageWMSNoParams);
    expect(layerHasTitle).toBe(false);
    setTitle(imageWMSNoParams, '');
    layerHasTitle = hasLayerTitle(imageWMSNoParams);
    expect(layerHasTitle).toBe(false);
  });
  it('check if layer is editable', () => {
    let isEditable = isLayerEditable(vectorLayer);
    expect(isEditable).toBe(true);
    setEditor(vectorLayer, {editable: undefined});
    isEditable = isLayerEditable(vectorLayer);
    expect(isEditable).toBe(true);
    setEditor(vectorLayer, {editable: false});
    isEditable = isLayerEditable(vectorLayer);
    expect(isEditable).toBe(false);
  });
  it('try to get layer name', () => {
    setTitle(vectorLayer, 'vector layer name');
    setName(vectorLayer, 'vector layer name');
    let layerName = getLayerName(vectorLayer);
    expect(layerName).toEqual('vector layer name');
    setShowInLayerManager(vectorLayer, false);
    layerName = getLayerName(vectorLayer);
    expect(layerName).toEqual('');
  });
  it('check if layer is drawable', () => {
    setShowInLayerManager(vectorLayer, true);
    setTitle(vectorLayer, 'vectorLayer');
    setEditor(vectorLayer, undefined);
    let isDrawable = isLayerDrawable(vectorLayer);
    expect(isDrawable).toBe(true);
    setTitle(vectorLayer, '');
    isDrawable = isLayerDrawable(vectorLayer);
    expect(isDrawable).toBe(false);
    isDrawable = isLayerDrawable(tileWMSLayer);
    expect(isDrawable).toBe(false);
  });
});
