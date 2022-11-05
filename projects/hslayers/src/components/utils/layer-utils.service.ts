import {Injectable, NgZone} from '@angular/core';

import Feature from 'ol/Feature';
import {default as FeatureFormat} from 'ol/format/Feature';
import IDW from 'ol-ext/source/IDW';
import {Tile as TileLayer} from 'ol/layer';
import {
  Cluster,
  ImageWMS,
  Source,
  TileArcGISRest,
  TileWMS,
  Vector as VectorSource,
  WMTS,
  XYZ,
} from 'ol/source';
import {GPX, GeoJSON, KML, TopoJSON} from 'ol/format';
import {Geometry} from 'ol/geom';
import {Image as ImageLayer, Layer, Vector as VectorLayer} from 'ol/layer';
import {isEmpty} from 'ol/extent';

import BaseLayer from 'ol/layer/Base';
import {HsLanguageService} from '../language/language.service';
import {HsLayerDescriptor} from '../layermanager/layer-descriptor.interface';
import {HsMapService} from '../map/map.service';
import {HsUtilsService} from './utils.service';
import {METERS_PER_UNIT} from 'ol/proj';
import {WmsLayer} from '../../common/get-capabilities/wms-get-capabilities-response.interface';
import {
  getCluster,
  getEditor,
  getName,
  getShowInLayerManager,
  getTitle,
} from '../../common/layer-extensions';

@Injectable({
  providedIn: 'root',
})
export class HsLayerUtilsService {
  constructor(
    public HsUtilsService: HsUtilsService,
    public HsLanguageService: HsLanguageService,
    public hsMapService: HsMapService,
    private zone: NgZone
  ) {}

  /**
   * Determines if layer has properties needed for 'Zoom to layer' function.
   * @param layer - Selected layer
   * @returns True for layer with BoundingBox property, for
   * WMS layer or for layer, which has source with extent
   */
  layerIsZoomable(layer: Layer<Source>): boolean {
    if (typeof layer == 'undefined') {
      return false;
    }
    if (layer.getExtent()) {
      return true;
    }
    if (this.isLayerWMS(layer)) {
      return true;
    }
    const src: any = layer.getSource();
    if (src.getExtent && src.getExtent() && !isEmpty(src.getExtent())) {
      return true;
    }
    return false;
  }

  /**
   * Determines if layer has underlying layers.
   * @param layer - Selected layer
   * @returns True for layer with sub layers, for layer type
   * WMS layer
   */
  hasNestedLayers(layer: WmsLayer): boolean {
    if (layer === undefined) {
      return false;
    }
    return layer.Layer !== undefined;
  }

  /**
   * Determines if layer is a Vector layer and therefore styleable
   * @param layer - Selected layer
   * @returns True for ol.layer.Vector
   */
  layerIsStyleable(layer: Layer<Source>): boolean {
    if (typeof layer == 'undefined') {
      return false;
    }
    if (
      this.HsUtilsService.instOf(
        layer,
        VectorLayer
      ) /*&& layer.getSource().styleAble*/
    ) {
      return true;
    }
    return false;
  }

  /**
   * Test if layer is queryable (WMS layer with Info format)
   * @param layer - Selected layer
   * @returns True for ol.layer.Tile and ol.layer.Image with
   * INFO_FORMAT in params
   */
  isLayerQueryable(layer: Layer<Source>): boolean {
    return this.isLayerWMS(layer) && !!this.getLayerParams(layer).INFO_FORMAT;
  }

  /**
   * Get title of selected layer
   * @param layer - to get layer title
   * @returns Layer title or "Void"
   */
  getLayerTitle(layer: Layer<Source>): string {
    if (getTitle(layer) !== undefined && getTitle(layer) != '') {
      return getTitle(layer).replace(/&#47;/g, '/');
    } else {
      return 'Void';
    }
  }

  // todo
  getURL(layer: Layer<Source>): string {
    const src = layer.getSource();
    if (this.HsUtilsService.instOf(src, ImageWMS)) {
      return (src as ImageWMS).getUrl();
    }
    if (this.HsUtilsService.instOf(src, TileArcGISRest)) {
      return (src as TileArcGISRest).getUrls()[0];
    }
    if (this.HsUtilsService.instOf(src, TileWMS)) {
      return (src as TileWMS).getUrls()[0];
    }
    if (this.HsUtilsService.instOf(src, WMTS)) {
      return (src as WMTS).getUrls()[0];
    }
    if (this.HsUtilsService.instOf(src, XYZ)) {
      return (src as XYZ).getUrls()[0];
    }
    if ((src as any).getUrl) {
      const tmpUrl = (src as any).getUrl();
      if (typeof tmpUrl == 'string') {
        return tmpUrl;
      } else if (this.HsUtilsService.isFunction(tmpUrl)) {
        return tmpUrl();
      }
    }
    if ((src as any).getUrls) {
      return (src as any).getUrls()[0];
    }
  }

  /**
   * Test if layer is WMS layer
   * @param layer - Selected layer
   * @returns True for ol.layer.Tile and ol.layer.Image
   */
  isLayerWMS(layer: Layer<Source>): boolean {
    if (
      this.HsUtilsService.instOf(layer, TileLayer) &&
      this.HsUtilsService.instOf(layer.getSource(), TileWMS)
    ) {
      return true;
    }
    if (
      this.HsUtilsService.instOf(layer, ImageLayer) &&
      this.HsUtilsService.instOf(layer.getSource(), ImageWMS)
    ) {
      return true;
    }
    return false;
  }

  // todo
  isLayerWMTS(layer: Layer<Source>): boolean {
    if (
      this.HsUtilsService.instOf(layer, TileLayer) &&
      this.HsUtilsService.instOf(layer.getSource(), WMTS)
    ) {
      return true;
    }
    return false;
  }

  isLayerXYZ(layer: Layer<Source>): boolean {
    if (
      this.HsUtilsService.instOf(layer, TileLayer) &&
      this.HsUtilsService.instOf(layer.getSource(), XYZ)
    ) {
      return true;
    }
    return false;
  }

  isLayerArcgis(layer: Layer<Source>): boolean {
    if (
      this.HsUtilsService.instOf(layer, TileLayer) &&
      this.HsUtilsService.instOf(layer.getSource(), TileArcGISRest)
    ) {
      return true;
    }
    return false;
  }

  isLayerIDW(layer: Layer<Source>): boolean {
    if (
      this.HsUtilsService.instOf(layer, ImageLayer) &&
      this.HsUtilsService.instOf(layer.getSource(), IDW)
    ) {
      return true;
    }
    return false;
  }

  getLayerSourceFormat(layer: Layer<Source>): FeatureFormat {
    if (!this.isLayerVectorLayer(layer)) {
      return;
    }
    return (layer as VectorLayer<VectorSource<Geometry>>)
      .getSource()
      ?.getFormat();
  }

  /**
   * Test if layer is Vector layer
   * @param layer - Selected layer
   * @returns True for Vector layer
   */
  isLayerVectorLayer(layer: BaseLayer): boolean {
    if (
      this.HsUtilsService.instOf(layer, VectorLayer) &&
      (this.HsUtilsService.instOf(
        (layer as VectorLayer<VectorSource>).getSource(),
        Cluster
      ) ||
        this.HsUtilsService.instOf(
          (layer as VectorLayer<VectorSource>).getSource(),
          VectorSource
        ))
    ) {
      return true;
    }
    return false;
  }

  /**
   * Test if the features in the vector layer come from a GeoJSON source
   * @param layer - an OL vector layer
   * @returns true only if the GeoJSON format is explicitly specified in the source. False otherwise.
   */
  isLayerGeoJSONSource(layer: Layer<Source>): boolean {
    if (this.HsUtilsService.instOf(this.getLayerSourceFormat(layer), GeoJSON)) {
      return true;
    }
    return false;
  }

  /**
   * Test if the features in the vector layer come from a TopoJSON source
   * @param layer - an OL vector layer
   * @returns true only if the TopoJSON format is explicitly specified in the source. False otherwise.
   */
  isLayerTopoJSONSource(layer: Layer<Source>): boolean {
    if (
      this.HsUtilsService.instOf(this.getLayerSourceFormat(layer), TopoJSON)
    ) {
      return true;
    }
    return false;
  }

  /**
   * Test if the features in the vector layer come from a KML source
   * @param layer - an OL vector layer
   * @returns true only if the KML format is explicitly specified in the source. False otherwise.
   */
  isLayerKMLSource(layer: Layer<Source>): boolean {
    if (this.HsUtilsService.instOf(this.getLayerSourceFormat(layer), KML)) {
      return true;
    }
    return false;
  }

  /**
   * Test if the features in the vector layer come from a GPX source
   * @param layer - an OL vector layer
   * @returns true only if the GPX format is explicitly specified in the source. False otherwise.
   */
  isLayerGPXSource(layer: Layer<Source>): boolean {
    if (this.HsUtilsService.instOf(this.getLayerSourceFormat(layer), GPX)) {
      return true;
    }
    return false;
  }

  /**
   * Test if layer is shown in layer switcher
   * (if not some internal hslayers layer like selected feature layer)
   * @param layer - Layer to check
   * @returns True if showInLayerManager attribute is set to true
   */
  isLayerInManager(layer: Layer<Source>): boolean {
    return (
      getShowInLayerManager(layer) === undefined ||
      getShowInLayerManager(layer) == true
    );
  }

  getSourceParams(
    source: ImageWMS | TileWMS | TileArcGISRest
  ): Record<string, any> {
    return source.getParams();
  }

  getLayerParams(layer: Layer<Source>): Record<string, any> {
    const src = layer.getSource();
    if (this.HsUtilsService.instOf(src, ImageWMS)) {
      return this.getSourceParams(src as ImageWMS);
    }
    if (this.HsUtilsService.instOf(src, TileWMS)) {
      return this.getSourceParams(src as TileWMS);
    }
    if (this.HsUtilsService.instOf(src, TileArcGISRest)) {
      return this.getSourceParams(src as TileArcGISRest);
    }
  }

  updateLayerParams(layer: Layer<Source>, params: any): void {
    const src = layer.getSource();
    if (this.HsUtilsService.instOf(src, ImageWMS)) {
      (src as ImageWMS).updateParams(params);
    }
    if (this.HsUtilsService.instOf(src, TileWMS)) {
      (src as TileWMS).updateParams(params);
    }
    if (this.HsUtilsService.instOf(src, TileArcGISRest)) {
      (src as TileArcGISRest).updateParams(params);
    }
  }

  /**
   * Test if layer is has a title
   * @param layer - Layer to check
   * @returns True if layer is has a title
   */
  hasLayerTitle(layer: Layer<Source>): boolean {
    return getTitle(layer) !== undefined && getTitle(layer) !== '';
  }

  /**
   * Test if layers features are editable
   * @param layer - Layer to check
   * @returns True if layer has attribute 'editor' and in it
   * 'editable' property is set to true or missing
   */
  isLayerEditable(layer: Layer<Source>): boolean {
    if (getEditor(layer) === undefined) {
      return true;
    }
    const editorConfig = getEditor(layer);
    if (editorConfig.editable === undefined) {
      return true;
    }
    return editorConfig.editable;
  }

  /**
   * Get user friendly name of layer based primary on title
   * and secondary on name attributes.
   * Is used in query service and hover popup.
   * @param layer - Layer to get the name for
   */
  getLayerName(layer: Layer<Source>): string {
    if (
      layer === undefined ||
      (getShowInLayerManager(layer) !== undefined &&
        getShowInLayerManager(layer) === false)
    ) {
      return '';
    } else {
      const layerName = getTitle(layer) || getName(layer);
      return layerName;
    }
  }

  /**
   * Highlight feature corresponding records inside a list
   * @param featuresUnder - Features under the cursor
   * @param layer - Layer to get features from
   */
  highlightFeatures(
    featuresUnder: Feature<Geometry>[],
    layer: VectorLayer<VectorSource<Geometry>>,
    list: {featureId?: string; highlighted?: boolean}[]
  ): void {
    const highlightedFeatures = list
      .filter((record) => record.highlighted)
      .map((record) => layer.getSource().getFeatureById(record.featureId));

    const dontHighlight = highlightedFeatures
      .filter((feature) => feature && !featuresUnder.includes(feature))
      .map((f) => f.getId());
    const highlight = featuresUnder
      .filter((feature) => feature && !highlightedFeatures.includes(feature))
      .map((f) => f.getId());
    if (dontHighlight.length > 0 || highlight.length > 0) {
      this.zone.run(() => {
        for (const record of list) {
          if (highlight.includes(record.featureId)) {
            record.highlighted = true;
          }
          if (dontHighlight.includes(record.featureId)) {
            record.highlighted = false;
          }
        }
      });
    }
  }

  /**
   * Checks if layer has a VectorSource object, if layer is
   * not internal for hslayers, if it has title and is shown in layer
   * switcher
   * @param layer - Layer to check
   * @returns True if layer is drawable vector layer
   */
  isLayerDrawable(layer: Layer<Source>): boolean {
    return (
      this.HsUtilsService.instOf(layer, VectorLayer) &&
      layer.getVisible() &&
      this.isLayerInManager(layer) &&
      this.hasLayerTitle(layer) &&
      this.isLayerEditable(layer)
    );
  }

  /**
   * Checks if layer's source has its own source
   * @param layer - Layer to check
   * @returns True if layer is clustered, false otherwise
   */
  isLayerClustered(layer: Layer<Source>): boolean {
    return this.isLayerVectorLayer(layer) &&
      getCluster(layer) &&
      this.HsUtilsService.instOf(layer.getSource(), Cluster)
      ? true
      : false;
  }

  translateTitle(title: string, app: string): string {
    return this.HsLanguageService.getTranslationIgnoreNonExisting(
      'LAYERS',
      title,
      undefined,
      app
    );
  }

  /**
   * Test if layers source is loaded
   * @param layer - Selected layer descriptor
   * @returns True loaded / False not (fully) loaded
   */
  layerLoaded(layer: HsLayerDescriptor): boolean {
    return layer.loadProgress?.loaded;
  }

  /**
   * Test if layers source is validly loaded (!true for invalid)
   * @param layer - Selected layer descriptor
   * @returns True invalid, false valid source
   */
  layerInvalid(layer: HsLayerDescriptor): boolean {
    return layer.loadProgress?.error;
  }

  calculateResolutionFromScale(denominator: number, app: string) {
    if (!denominator) {
      return denominator;
    }
    const view = this.hsMapService.getMap(app).getView();
    const units = view.getProjection().getUnits();
    const dpi = 25.4 / 0.28;
    const mpu = METERS_PER_UNIT[units];
    return denominator / (mpu * 39.37 * dpi);
  }
}
