import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {TestBed} from '@angular/core/testing';

import {Cluster, ImageWMS, OSM, TileWMS, Vector, WMTS} from 'ol/source';
import {Image as ImageLayer, Tile, Vector as VectorLayer} from 'ol/layer';

import {HsLanguageService} from 'hslayers-ng/shared/language';
import {HsLayerUtilsService} from 'hslayers-ng/shared/utils';
import {HsMapService} from 'hslayers-ng/shared/map';
import {HsMapServiceMock} from './map.service.mock';
import {HsUtilsService} from 'hslayers-ng/shared/utils';
import {HsUtilsServiceMock} from './utils.service.mock';
import {
  getTitle,
  setCluster,
  setEditor,
  setName,
  setShowInLayerManager,
  setTitle,
} from 'hslayers-ng/common/extensions';

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
  let hsLayerUtils: HsLayerUtilsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        {provide: HsMapService, useValue: new HsMapServiceMock()},
        HsLayerUtilsService,
        {
          provide: HsUtilsService,
          useValue: new HsUtilsServiceMock(),
        },
        {
          provide: HsLanguageService,
          useValue: mockedLanguageService,
        },
      ],
    });
    hsLayerUtils = TestBed.inject(HsLayerUtilsService);
  });

  it('check if layer is clustered', () => {
    const source = new Vector();
    vectorLayer.setSource(new Cluster({source: source}));
    setCluster(vectorLayer, true);
    let isClustered = hsLayerUtils.isLayerClustered(vectorLayer);
    expect(isClustered).toBe(true);
    vectorLayer.setSource(source);
    setCluster(vectorLayer, false);
    isClustered = hsLayerUtils.isLayerClustered(vectorLayer);
    expect(isClustered).toBe(false);
  });
  it('check if layer is stylable', () => {
    let isLayerStylable = hsLayerUtils.layerIsStyleable(vectorLayer);
    expect(isLayerStylable).toBe(true);
    isLayerStylable = hsLayerUtils.layerIsStyleable(tileWMSLayer);
    expect(isLayerStylable).toBe(false);
  });
  it('check if layer is queryable', () => {
    let isLayerQueryable = hsLayerUtils.isLayerQueryable(tileWMSLayer);
    expect(isLayerQueryable).toBe(false);
    isLayerQueryable = hsLayerUtils.isLayerQueryable(imageWMSLayer);
    expect(isLayerQueryable).toBe(true);
    isLayerQueryable = hsLayerUtils.isLayerQueryable(imageWMSNoParams);
    expect(isLayerQueryable).toBe(false);
  });
  it('try to get layer title', () => {
    let layerTitle = hsLayerUtils.getLayerTitle(tileWMSLayer);
    expect(layerTitle).toEqual('tileWMSLayer');
    setTitle(vectorLayer, '&#47;vectorLayer');
    layerTitle = hsLayerUtils.getLayerTitle(vectorLayer);
    expect(layerTitle).toEqual('/vectorLayer');
    layerTitle = hsLayerUtils.getLayerTitle(imageWMSNoParams);
    expect(layerTitle).toEqual('Void');
  });
  it('check if layer is WMS', () => {
    let isLayerWMS = hsLayerUtils.isLayerWMS(tileWMSLayer);
    expect(isLayerWMS).toBe(true);
    isLayerWMS = hsLayerUtils.isLayerWMS(tileOSMLayer);
    expect(isLayerWMS).toBe(false);
    isLayerWMS = hsLayerUtils.isLayerWMS(imageWMSLayer);
    expect(isLayerWMS).toBe(true);
    isLayerWMS = hsLayerUtils.isLayerWMS(vectorLayer);
    expect(isLayerWMS).toBe(false);
  });
  it('check if layer is WMTS', () => {
    let isLayerWMTS = hsLayerUtils.isLayerWMTS(tileWMTSLayer);
    expect(isLayerWMTS).toBe(true);
    isLayerWMTS = hsLayerUtils.isLayerWMTS(tileOSMLayer);
    expect(isLayerWMTS).toBe(false);
  });
  it('check if layer is vectorLayer', () => {
    let isVectorLayer = hsLayerUtils.isLayerVectorLayer(vectorLayer);
    expect(isVectorLayer).toBe(true);
    vectorLayer.setSource(new Cluster({source: new Vector()}));
    isVectorLayer = hsLayerUtils.isLayerVectorLayer(vectorLayer);
    expect(isVectorLayer).toBe(true);
    isVectorLayer = hsLayerUtils.isLayerVectorLayer(imageWMSLayer);
    expect(isVectorLayer).toBe(false);
  });
  it('try to get layer single tile url or multiple tile url', () => {
    let layerUrl = hsLayerUtils.getURL(tileWMTSLayer);

    expect(layerUrl).toEqual(
      'https://openlayers.org/en/latest/examples/wmts.html',
    );
    layerUrl = hsLayerUtils.getURL(tileOSMLayer);
    expect(layerUrl).toEqual('https://tile.openstreetmap.org/{z}/{x}/{y}.png');
  });
  it('check if layer is in LayerManager', () => {
    setShowInLayerManager(tileWMTSLayer, true);
    setShowInLayerManager(tileOSMLayer, false);
    let isLayerInManager = hsLayerUtils.isLayerInManager(tileWMTSLayer);
    expect(isLayerInManager).toBe(true);
    isLayerInManager = hsLayerUtils.isLayerInManager(tileOSMLayer);
    expect(isLayerInManager).toBe(false);
  });
  it('check if layer has title', () => {
    let layerHasTitle = hsLayerUtils.hasLayerTitle(tileWMTSLayer);
    expect(layerHasTitle).toBe(true);
    layerHasTitle = hsLayerUtils.hasLayerTitle(imageWMSNoParams);
    expect(layerHasTitle).toBe(false);
    setTitle(imageWMSNoParams, '');
    layerHasTitle = hsLayerUtils.hasLayerTitle(imageWMSNoParams);
    expect(layerHasTitle).toBe(false);
  });
  it('check if layer is editable', () => {
    let isLayerEditable = hsLayerUtils.isLayerEditable(vectorLayer);
    expect(isLayerEditable).toBe(true);
    setEditor(vectorLayer, {editable: undefined});
    isLayerEditable = hsLayerUtils.isLayerEditable(vectorLayer);
    expect(isLayerEditable).toBe(true);
    setEditor(vectorLayer, {editable: false});
    isLayerEditable = hsLayerUtils.isLayerEditable(vectorLayer);
    expect(isLayerEditable).toBe(false);
  });
  it('try to get layer name', () => {
    setTitle(vectorLayer, 'vector layer name');
    setName(vectorLayer, 'vector layer name');
    let layerName = hsLayerUtils.getLayerName(vectorLayer);
    expect(layerName).toEqual('vector layer name');
    setShowInLayerManager(vectorLayer, false);
    layerName = hsLayerUtils.getLayerName(vectorLayer);
    expect(layerName).toEqual('');
  });
  it('check if layer is drawable', () => {
    setShowInLayerManager(vectorLayer, true);
    setTitle(vectorLayer, 'vectorLayer');
    setEditor(vectorLayer, undefined);
    let isLayerDrawable = hsLayerUtils.isLayerDrawable(vectorLayer);
    expect(isLayerDrawable).toBe(true);
    setTitle(vectorLayer, '');
    isLayerDrawable = hsLayerUtils.isLayerDrawable(vectorLayer);
    expect(isLayerDrawable).toBe(false);
    isLayerDrawable = hsLayerUtils.isLayerDrawable(tileWMSLayer);
    expect(isLayerDrawable).toBe(false);
  });
  it('try to translate the layer title', () => {
    setTitle(vectorLayer, 'vectorLayer');
    mockedLanguageService.getTranslationIgnoreNonExisting
      .withArgs('LAYERS', 'vectorLayer', undefined)
      .and.returnValue('vectorLayer');
    const layerTitle = hsLayerUtils.translateTitle(getTitle(vectorLayer));
    expect(layerTitle).toEqual('vectorLayer');
  });
});
