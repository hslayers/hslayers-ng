import {Injectable, NgZone} from '@angular/core';

import BaseLayer from 'ol/layer/Base';
import IDW from 'ol-ext/source/IDW';
import {Big} from 'big.js';
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
import {Extent, isEmpty} from 'ol/extent';
import {Feature, View} from 'ol';
import {default as FeatureFormat} from 'ol/format/Feature';
import {Geometry} from 'ol/geom';
import {HsLayerDescriptor} from 'hslayers-ng/types';
import {HsUtilsService} from './utils.service';
import {HsWmsLayer} from 'hslayers-ng/types';
import {Image as ImageLayer, Layer, Vector as VectorLayer} from 'ol/layer';
import {METERS_PER_UNIT, Projection, transformExtent} from 'ol/proj';
import {Tile as TileLayer} from 'ol/layer';
import {VectorImage} from 'ol/layer';
import {
  getCluster,
  getEditor,
  getName,
  getShowInLayerManager,
  getTitle,
} from 'hslayers-ng/common/extensions';

@Injectable({
  providedIn: 'root',
})
export class HsLayerUtilsService {
  constructor(
    public HsUtilsService: HsUtilsService,
    private zone: NgZone,
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
  hasNestedLayers(layer: HsWmsLayer): boolean {
    if (layer === undefined) {
      return false;
    }
    return layer.Layer !== undefined;
  }

  /**
   * Determines if layer is a Vector layer and therefore stylable
   * @param layer - Selected layer
   * @returns True for ol.layer.Vector
   */
  layerIsStyleable(layer: Layer<Source>): boolean {
    if (typeof layer == 'undefined') {
      return false;
    }
    return this.isLayerVectorLayer(layer, false);
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
    const isTileLayer = this.HsUtilsService.instOf(layer, TileLayer);
    const src = layer.getSource();
    const isTileWMSSource = this.HsUtilsService.instOf(src, TileWMS);
    if (isTileLayer && isTileWMSSource) {
      return true;
    }
    const src2 = layer.getSource();
    const isImageLayer = this.HsUtilsService.instOf(layer, ImageLayer);
    const isImageWMSSource = this.HsUtilsService.instOf(src2, ImageWMS);
    if (isImageLayer && isImageWMSSource) {
      return true;
    }
    return false;
  }

  isLayerWMTS(layer: Layer<Source>): boolean {
    const isTileLayer = this.HsUtilsService.instOf(layer, TileLayer);
    const src = layer.getSource();
    const isWMTSSource = this.HsUtilsService.instOf(src, WMTS);
    if (isTileLayer && isWMTSSource) {
      return true;
    }
    return false;
  }

  isLayerXYZ(layer: Layer<Source>): boolean {
    const isTileLayer = this.HsUtilsService.instOf(layer, TileLayer);
    const src = layer.getSource();
    const isXYZSource = this.HsUtilsService.instOf(src, XYZ);
    if (isTileLayer && isXYZSource) {
      return true;
    }
    return false;
  }

  isLayerArcgis(layer: Layer<Source>): boolean {
    const isTileLayer = this.HsUtilsService.instOf(layer, TileLayer);
    const src = layer.getSource();
    const isArcgisSource = this.HsUtilsService.instOf(src, TileArcGISRest);
    if (isTileLayer && isArcgisSource) {
      return true;
    }
    return false;
  }

  isLayerIDW(layer: Layer<Source>): boolean {
    const isImageLayer = this.HsUtilsService.instOf(layer, ImageLayer);
    const src = layer.getSource();
    const isIDWSource = this.HsUtilsService.instOf(src, IDW);
    if (isImageLayer && isIDWSource) {
      return true;
    }
    return false;
  }

  getLayerSourceFormat(layer: Layer<Source>): FeatureFormat {
    if (!this.isLayerVectorLayer(layer)) {
      return;
    }
    return (layer as VectorLayer<VectorSource<Feature>>)
      .getSource()
      ?.getFormat();
  }

  /**
   * Test if layer is Vector layer
   * @param layer - Selected layer
   * @param includingClusters - Whether to treat clusters as Vectors or not, Defaults to true
   * @returns True for Vector layer
   */
  isLayerVectorLayer(layer: BaseLayer, includingClusters = true): boolean {
    if (
      (this.HsUtilsService.instOf(layer, VectorLayer) ||
        this.HsUtilsService.instOf(layer, VectorImage)) &&
      /**
       * This part is not entirely correct as we cast both VectorLayer and VectorImage
       * as VectorLayer but the differences are not relevant for the sake of the check
       */
      includingClusters
        ? this.HsUtilsService.instOf(
            (layer as VectorLayer<VectorSource<Feature>>).getSource(),
            Cluster,
          ) ||
          this.HsUtilsService.instOf(
            (layer as VectorLayer<VectorSource<Feature>>).getSource(),
            VectorSource,
          )
        : this.HsUtilsService.instOf(
            (layer as VectorLayer<VectorSource<Feature>>).getSource(),
            VectorSource,
          )
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
  async isLayerGeoJSONSource(layer: Layer<Source>): Promise<boolean> {
    const GeoJSON = (await import('ol/format/GeoJSON')).default;
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
  async isLayerTopoJSONSource(layer: Layer<Source>): Promise<boolean> {
    const TopoJSON = (await import('ol/format/TopoJSON')).default;
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
  async isLayerKMLSource(layer: Layer<Source>): Promise<boolean> {
    const KML = (await import('ol/format/KML')).default;
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
  async isLayerGPXSource(layer: Layer<Source>): Promise<boolean> {
    const GPX = (await import('ol/format/GPX')).default;
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
    source: ImageWMS | TileWMS | TileArcGISRest,
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
    layer: VectorLayer<VectorSource<Feature>>,
    list: {featureId?: string; highlighted?: boolean}[],
  ): void {
    const highlightedFeatures = list
      .filter((record) => record.highlighted)
      .map(
        (record) =>
          layer.getSource().getFeatureById(record.featureId) as Feature,
      );

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
      this.isLayerVectorLayer(layer, false) &&
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
    if (!layer.layer?.getSource()) {
      return true;
    }
    return layer.loadProgress?.error;
  }

  calculateResolutionFromScale(denominator: number, view: View) {
    if (!denominator) {
      return denominator;
    }
    const units = view.getProjection().getUnits();
    const dpi = 25.4 / 0.28;
    const mpu = METERS_PER_UNIT[units];
    return denominator / (mpu * 39.37 * dpi);
  }

  /**
   * List numeric attributes of the feature
   */
  listNumericAttributes(features: Feature[]) {
    return this.listAttributes(features, true);
  }

  private readonly ATTRIBUTES_EXCLUDED_FROM_LIST = [
    'geometry',
    'hs_normalized_IDW_value',
  ];

  /**
   * List all attributes of the feature apart from the geometry
   */
  listAttributes(features: Feature[], numericOnly = false): string[] {
    return features.length > 0
      ? Object.keys(features[0].getProperties()).filter((attr) => {
          return (
            !this.ATTRIBUTES_EXCLUDED_FROM_LIST.includes(attr) &&
            (!numericOnly || !isNaN(Number(features[0].get(attr))))
          );
        })
      : [];
  }

  // Coefficients of the polynomial (in reverse order for easy use in the loop)
  private COEFFICIENTS: Big[] = [
    new Big('-1.31228099e-15'),
    new Big('1.49629747e-11'),
    new Big('-4.93320288e-08'),
    new Big('1.22907821e-05'),
    new Big('1.19666463e-01'),
  ];

  /**
   * Calculates a buffer factor based on polynomial evaluation using Horner's method.
   *
   * This function evaluates a 4th-degree polynomial with pre-calculated coefficients
   * to determine a buffer factor. The function is designed to return a value close to 0.12
   * for smaller distances (approximately 0-300 kilometers) and gradually decrease to 0 as the
   * distance approaches 4000 kilometers.
   *
   * Note: This function is intended for use with input values up to 4000 meters.
   * Using values greater than 4000 kilometers may produce unexpected results
   */
  getPolynomialBufferFactor(x: number): number {
    // Convert x to a Big object
    const xBig = new Big(x);
    // Calculate polynomial value using Horner's method with a for...of loop
    let result = new Big(0);
    for (const coefficient of this.COEFFICIENTS) {
      result = result.times(xBig).plus(coefficient);
    }

    // Return the result as a regular, positive JavaScript number
    return Math.abs(result.toNumber());
  }

  /**
   * Buffer extent by `BUFFER_FACTOR`
   * NOTE: Not using OL because we want to extend width and height independently
   */
  bufferExtent(extent: Extent, currentMapProj: Projection) {
    if (!extent) {
      return undefined;
    }
    //EPSG:4087 world bounds
    const [pMinX, pMinY, pMaxX, pMaxY] = [
      -20037508.342789, -10018754.171394, 20037508.342789, 10018754.171394,
    ];
    //Transform into projection suitable for area manipulation
    const transformed = transformExtent(extent, currentMapProj, 'EPSG:4087');

    //Calculate buffer values
    const extentWidth = Math.abs(transformed[2] - transformed[0]);
    const extentHeight = Math.abs(transformed[3] - transformed[1]);

    // Calculate diagonal length
    const diagonalLength = Math.sqrt(extentWidth ** 2 + extentHeight ** 2);

    const BUFFER_FACTOR =
      diagonalLength < 4000000
        ? this.getPolynomialBufferFactor(diagonalLength / 1000) //convert to kilometers
        : 0.0001; //

    const bufferWidth = extentWidth * BUFFER_FACTOR;
    const bufferHeight = extentHeight * BUFFER_FACTOR;

    //Buffer extent and transform back to currentMapProj
    const extended = [
      Math.max(pMinX, transformed[0] - bufferWidth),
      Math.max(pMinY, transformed[1] - bufferHeight),
      Math.min(pMaxX, transformed[2] + bufferWidth),
      Math.min(pMaxY, transformed[3] + bufferHeight),
    ];

    return transformExtent(extended, 'EPSG:4087', currentMapProj);
  }
}
