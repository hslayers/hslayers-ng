import {TestBed} from '@angular/core/testing';

import {
  getLayerParams,
  isLayerArcgis,
  updateLayerParams,
} from 'hslayers-ng/services/utils';

import wmsLayers from '../data/wms-layer.json';
import {HsLayerDescriptor, HsWmsLayer} from 'hslayers-ng/types';
import {HsLayerEditorSublayerService} from 'hslayers-ng/components/layer-manager';
import {HsLayerManagerVisibilityService} from 'hslayers-ng/services/layer-manager';
import {Tile} from 'ol/layer';
import {TileArcGISRest, TileWMS} from 'ol/source';

const layerManagerVisibilityServiceSpy = jasmine.createSpyObj(
  'HsLayerManagerVisibilityService',
  ['changeLayerVisibility'],
);

const olLayer = new Tile({
  visible: false,
  properties: {
    title: 'WMS Katastrální mapy',
  },
  source: new TileWMS({
    url: 'http://services.cuzk.cz/wms/local-km-wms.asp',
    params: {
      LAYERS: 'KN',
      INFO_FORMAT: undefined,
      FORMAT: 'image/png; mode=8bit',
    },
    crossOrigin: 'anonymous',
  }),
});

const arcgisLayer = new Tile({
  visible: false,
  properties: {
    title: 'ArcGIS Layer',
  },
  source: new TileArcGISRest({
    url: 'https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer',
    params: {
      LAYERS: '0',
    },
  }),
});

describe('HsLayerEditorSublayerService', () => {
  let service: HsLayerEditorSublayerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: HsLayerManagerVisibilityService,
          useValue: layerManagerVisibilityServiceSpy,
        },
        HsLayerEditorSublayerService,
      ],
    });

    service = TestBed.inject(HsLayerEditorSublayerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('mapWMSToLayerVisibility', () => {
    it('should map WMS layers to HsSublayer including nested layers', () => {
      const result = service.mapWMSToLayerVisibility(
        wmsLayers as unknown as HsWmsLayer[],
        true,
      );

      expect(result.length).toBe(4);

      // Check top-level layers
      expect(result[0].name).toBe('RST_KN');
      expect(result[0].title).toBe('Analogové mapy');
      expect(result[0].visible).toBeTrue();
      expect(result[0].maxResolution).toBe(1.4000028000056004);

      expect(result[1].name).toBe('RST_KMD');
      expect(result[1].visible).toBeTrue();
      expect(result[1].maxResolution).toBe(1.4000028000056004);

      expect(result[2].name).toBe('omp');
      expect(result[2].visible).toBeTrue();
      expect(result[2].maxResolution).toBe(1.4000028000056004);

      // Check nested layers
      expect(result[3].name).toBe('DKM');
      expect(result[3].title).toBe('Vrstva DKM');
      expect(result[3].visible).toBeTrue();
      expect(result[3].sublayers).toBeDefined();
      expect(result[3].sublayers.length).toBe(4);

      // Check a nested sublayer
      const nestedLayer = result[3].sublayers[0];
      expect(nestedLayer.name).toBe('parcelni_cisla');
      expect(nestedLayer.visible).toBeTrue();
      expect(nestedLayer.maxResolution).toBe(0.5600011200022402);
    });
  });

  describe('constructLayersParam', () => {
    it('should include parent layers', () => {
      const sublayers = service.mapWMSToLayerVisibility(
        wmsLayers as unknown as HsWmsLayer[],
        true,
      );

      const result = service.constructLayersParam(sublayers);
      expect(result).toBe('RST_KN,RST_KMD,omp,DKM');
    });

    it('should replace parent (DKM) with subsublayers & do not include RST_KN at all', () => {
      const sublayers = service.mapWMSToLayerVisibility(
        wmsLayers as unknown as HsWmsLayer[],
        true,
      );

      sublayers[0].visible = false;
      sublayers[3].sublayers[0].visible = false;

      const result = service.constructLayersParam(sublayers);
      expect(result).toBe(
        'RST_KMD,omp,obrazy_parcel,hranice_parcel,dalsi_p_mapy',
      );
    });
  });

  describe('subLayerSelected', () => {
    it('should update layer visibility and params', () => {
      const layer: HsLayerDescriptor = {
        layer: olLayer,
        visible: true,
        _sublayers: [
          {
            name: 'layer1',
            title: 'Layer 1',
            visible: true,
            previousVisible: undefined,
          },
          {
            name: 'layer2',
            title: 'Layer 2',
            visible: false,
            previousVisible: undefined,
          },
        ],
      };
      service.layer = layer;
      const source = layer.layer.getSource() as TileWMS;

      service.subLayerSelected();

      const params = source.getParams();
      expect(layer.visible).toBe(true);
      expect(params.LAYERS).toBe('layer1');
    });

    it('should handle ArcGIS layers', () => {
      const layer: HsLayerDescriptor = {
        layer: arcgisLayer,
        visible: true,
        _sublayers: [
          {
            name: 'layer1',
            title: 'Layer 1',
            visible: true,
            previousVisible: undefined,
          },
        ],
      };
      service.layer = layer;

      service.subLayerSelected();

      const source = layer.layer.getSource() as TileArcGISRest;
      const params = source.getParams();
      expect(layer.visible).toBe(true);
      expect(params.LAYERS).toBe('show:layer1');
    });
  });
});
