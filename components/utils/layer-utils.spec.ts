/* eslint-disable angular/di */
import 'core-js/es6/reflect';
import 'core-js/es7/reflect';
import 'reflect-metadata';
import 'zone.js/dist/zone';
import 'zone.js/dist/zone-testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {Cluster, ImageWMS, OSM, TileWMS, Vector, WMTS} from 'ol/source';
import {HsLanguageService} from '../language/language.service';
import {HsLayerUtilsService} from './layer-utils.service';
import {HsUtilsService} from './utils.service';
import {HsUtilsServiceMock} from './utils.service.mock';
import {Image as ImageLayer, Tile, Vector as VectorLayer} from 'ol/layer';
import {TestBed} from '@angular/core/testing';

describe('HsLayerUtilsService', () => {
  const vectorLayer = new VectorLayer({
    title: 'vectorLayer',
    source: new Vector(),
  });
  const tileWMSLayer = new Tile({
    title: 'tileWMSLayer',
    source: new TileWMS({
      params: {
        INFO_FORMAT: undefined,
      },
    }),
  });
  const imageWMSLayer = new ImageLayer({
    title: 'imageWMSLayer',
    source: new ImageWMS({
      params: {INFO_FORMAT: 'application/json'},
    }),
  });
  const tileOSMLayer = new Tile({
    title: 'tileOSMLayer',
    source: new OSM(),
  });
  const tileWMTSLayer = new Tile({
    title: 'tileWMTSLayer',
    source: new WMTS({
      url: 'https://openlayers.org/en/latest/examples/wmts.html',
    }),
  });
  const imageWMSNoParams = new ImageLayer({
    source: new ImageWMS({}),
  });
  beforeAll(() => {
    TestBed.resetTestEnvironment();
    TestBed.initTestEnvironment(
      BrowserDynamicTestingModule,
      platformBrowserDynamicTesting()
    );
  });
  let hsLayerUtils: HsLayerUtilsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        HsLayerUtilsService,
        {
          provide: HsUtilsService,
          useValue: new HsUtilsServiceMock(),
        },
        {
          provide: HsLanguageService,
          useValue: {
            getTranslationIgnoreNonExisting: (module: string, text: string) => {
              return text;
            },
          },
        },
      ],
    });
    hsLayerUtils = TestBed.get(HsLayerUtilsService);
  });

  it('check if layer is clustered', () => {
    const source = new Vector();
    vectorLayer.setSource(new Cluster({source: source}));
    vectorLayer.set('cluster', true);
    let isClustered = hsLayerUtils.isLayerClustered(vectorLayer);
    expect(isClustered).toBe(true);
    vectorLayer.setSource(source);
    vectorLayer.set('cluster', false);
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
    vectorLayer.set('title', '&#47;vectorLayer');
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
  it('trry to get layer single tile url or multiple tile url', () => {
    let layerUrl = hsLayerUtils.getURL(tileWMTSLayer);
    expect(layerUrl).toEqual(
      'https://openlayers.org/en/latest/examples/wmts.html'
    );
    layerUrl = hsLayerUtils.getURL(tileOSMLayer);
    expect(layerUrl).toEqual(
      'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'
    );
  });
  it('check if layer is in LayerManager', () => {
    tileWMTSLayer.set('show_in_manager', true);
    tileOSMLayer.set('show_in_manager', false);
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
    imageWMSNoParams.set('title', '');
    layerHasTitle = hsLayerUtils.hasLayerTitle(imageWMSNoParams);
    expect(layerHasTitle).toBe(false);
  });
  it('check if layer is editable', () => {
    let isLayerEditable = hsLayerUtils.isLayerEditable(vectorLayer);
    expect(isLayerEditable).toBe(true);
    vectorLayer.set('editor', {editable: undefined});
    isLayerEditable = hsLayerUtils.isLayerEditable(vectorLayer);
    expect(isLayerEditable).toBe(true);
    vectorLayer.set('editor', {editable: false});
    isLayerEditable = hsLayerUtils.isLayerEditable(vectorLayer);
    expect(isLayerEditable).toBe(false);
  });
  it('try to get layer name', () => {
    vectorLayer.set('title', 'vector layer name');
    vectorLayer.set('name', 'vector layer name');
    let layerName = hsLayerUtils.getLayerName(vectorLayer);
    expect(layerName).toEqual('vector layer name');
    vectorLayer.set('show_in_manager', false);
    layerName = hsLayerUtils.getLayerName(vectorLayer);
    expect(layerName).toEqual('');
  });
  it('check if layer is drawable', () => {
    vectorLayer.set('show_in_manager', true);
    vectorLayer.set('title', 'vectorLayer');
    vectorLayer.set('editor', undefined);
    let isLayerDrawable = hsLayerUtils.isLayerDrawable(vectorLayer);
    expect(isLayerDrawable).toBe(true);
    vectorLayer.set('title', '');
    isLayerDrawable = hsLayerUtils.isLayerDrawable(vectorLayer);
    expect(isLayerDrawable).toBe(false);
    isLayerDrawable = hsLayerUtils.isLayerDrawable(tileWMSLayer);
    expect(isLayerDrawable).toBe(false);
  });
  it('try to translate the layer title', () => {
    vectorLayer.set('title', 'vectorLayer');
    const layerTitle = hsLayerUtils.translateTitle(vectorLayer.get('title'));
    expect(layerTitle).toEqual('vectorLayer');
  });
  it('check if layer is loaded', () => {
    vectorLayer.getSource().loaded = true;
    const islayerLoaded = hsLayerUtils.layerLoaded(vectorLayer);
    expect(islayerLoaded).toBe(true);
  });
  it('check if layer is invalid', () => {
    vectorLayer.getSource().error = true;
    const islayerInvalid = hsLayerUtils.layerInvalid(vectorLayer);
    expect(islayerInvalid).toBe(true);
  });
});
