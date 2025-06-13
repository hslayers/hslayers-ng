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
import {HsLayerDescriptor, HsWmsLayer} from 'hslayers-ng/types';
import {
  Image as ImageLayer,
  Layer,
  Vector as VectorLayer,
  Tile as TileLayer,
  VectorImage,
} from 'ol/layer';
import {METERS_PER_UNIT, Projection, transformExtent} from 'ol/proj';
import {
  getCluster,
  getEditor,
  getName,
  getShowInLayerManager,
  getTitle,
} from 'hslayers-ng/common/extensions';
import {instOf, isFunction} from './utils';

/**
 * Determines if layer has properties needed for 'Zoom to layer' function.
 * @param layer - Selected layer
 * @returns True for layer with BoundingBox property, for
 * WMS layer or for layer, which has source with extent
 */
export function layerIsZoomable(layer: Layer<Source>): boolean {
  if (typeof layer == 'undefined') {
    return false;
  }
  if (layer.getExtent()) {
    return true;
  }
  if (isLayerWMS(layer)) {
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
export function hasNestedLayers(layer: HsWmsLayer): boolean {
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
export function layerIsStyleable(layer: Layer<Source>): boolean {
  if (typeof layer == 'undefined') {
    return false;
  }
  return isLayerVectorLayer(layer, false);
}

/**
 * Test if layer is queryable (WMS layer with Info format)
 * @param layer - Selected layer
 * @returns True for ol.layer.Tile and ol.layer.Image with
 * INFO_FORMAT in params
 */
export function isLayerQueryable(layer: Layer<Source>): boolean {
  return isLayerWMS(layer) && !!getLayerParams(layer).INFO_FORMAT;
}

/**
 * Get title of selected layer
 * @param layer - to get layer title
 * @returns Layer title or "Void"
 */
export function getLayerTitle(layer: Layer<Source>): string {
  if (getTitle(layer) !== undefined && getTitle(layer) != '') {
    return getTitle(layer).replace(/&#47;/g, '/');
  }
  return 'Void';
}

export function getURL(layer: Layer<Source>): string {
  const src = layer.getSource();
  if (instOf(src, ImageWMS)) {
    return (src as ImageWMS).getUrl();
  }
  if (instOf(src, TileArcGISRest)) {
    return (src as TileArcGISRest).getUrls()[0];
  }
  if (instOf(src, TileWMS)) {
    return (src as TileWMS).getUrls()[0];
  }
  if (instOf(src, WMTS)) {
    return (src as WMTS).getUrls()[0];
  }
  if (instOf(src, XYZ)) {
    const urls = (src as XYZ).getUrls();
    return urls ? urls[0] : '';
  }
  if ((src as any).getUrl) {
    const tmpUrl = (src as any).getUrl();
    if (typeof tmpUrl == 'string') {
      return tmpUrl;
    }
    if (isFunction(tmpUrl)) {
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
export function isLayerWMS(layer: Layer<Source>): boolean {
  const isTileLayer = instOf(layer, TileLayer);
  const src = layer.getSource();
  const isTileWMSSource = instOf(src, TileWMS);
  if (isTileLayer && isTileWMSSource) {
    return true;
  }
  const src2 = layer.getSource();
  const isImageLayer = instOf(layer, ImageLayer);
  const isImageWMSSource = instOf(src2, ImageWMS);
  if (isImageLayer && isImageWMSSource) {
    return true;
  }
  return false;
}

export function isLayerWMTS(layer: Layer<Source>): boolean {
  const isTileLayer = instOf(layer, TileLayer);
  const src = layer.getSource();
  const isWMTSSource = instOf(src, WMTS);
  if (isTileLayer && isWMTSSource) {
    return true;
  }
  return false;
}

export function isLayerXYZ(layer: Layer<Source>): boolean {
  const isTileLayer = instOf(layer, TileLayer);
  const src = layer.getSource();
  const isXYZSource = instOf(src, XYZ);
  if (isTileLayer && isXYZSource) {
    return true;
  }
  return false;
}

export function isLayerArcgis(layer: Layer<Source>): boolean {
  const isTileLayer = instOf(layer, TileLayer);
  const src = layer.getSource();
  const isArcgisSource = instOf(src, TileArcGISRest);
  if (isTileLayer && isArcgisSource) {
    return true;
  }
  return false;
}

export function isLayerIDW(layer: Layer<Source>): boolean {
  const isImageLayer = instOf(layer, ImageLayer);
  const src = layer.getSource();
  const isIDWSource = instOf(src, IDW);
  if (isImageLayer && isIDWSource) {
    return true;
  }
  return false;
}

export function getLayerSourceFormat(layer: Layer<Source>): FeatureFormat {
  if (!isLayerVectorLayer(layer)) {
    return;
  }
  return (layer as VectorLayer<VectorSource<Feature>>).getSource()?.getFormat();
}

/**
 * Test if layer is Vector layer
 * @param layer - Selected layer
 * @param includingClusters - Whether to treat clusters as Vectors or not, Defaults to true
 * @returns True for Vector layer
 */
export function isLayerVectorLayer(
  layer: BaseLayer,
  includingClusters = true,
): boolean {
  if (
    (instOf(layer, VectorLayer) || instOf(layer, VectorImage)) &&
    /**
     * This part is not entirely correct as we cast both VectorLayer and VectorImage
     * as VectorLayer but the differences are not relevant for the sake of the check
     */
    includingClusters
      ? instOf(
          (layer as VectorLayer<VectorSource<Feature>>).getSource(),
          Cluster,
        ) ||
        instOf(
          (layer as VectorLayer<VectorSource<Feature>>).getSource(),
          VectorSource,
        )
      : instOf(
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
export async function isLayerGeoJSONSource(
  layer: Layer<Source>,
): Promise<boolean> {
  const GeoJSON = (await import('ol/format/GeoJSON')).default;
  if (instOf(getLayerSourceFormat(layer), GeoJSON)) {
    return true;
  }
  return false;
}

/**
 * Test if the features in the vector layer come from a TopoJSON source
 * @param layer - an OL vector layer
 * @returns true only if the TopoJSON format is explicitly specified in the source. False otherwise.
 */
export async function isLayerTopoJSONSource(
  layer: Layer<Source>,
): Promise<boolean> {
  const TopoJSON = (await import('ol/format/TopoJSON')).default;
  if (instOf(getLayerSourceFormat(layer), TopoJSON)) {
    return true;
  }
  return false;
}

/**
 * Test if the features in the vector layer come from a KML source
 * @param layer - an OL vector layer
 * @returns true only if the KML format is explicitly specified in the source. False otherwise.
 */
export async function isLayerKMLSource(layer: Layer<Source>): Promise<boolean> {
  const KML = (await import('ol/format/KML')).default;
  if (instOf(getLayerSourceFormat(layer), KML)) {
    return true;
  }
  return false;
}

/**
 * Test if the features in the vector layer come from a GPX source
 * @param layer - an OL vector layer
 * @returns true only if the GPX format is explicitly specified in the source. False otherwise.
 */
export async function isLayerGPXSource(layer: Layer<Source>): Promise<boolean> {
  const GPX = (await import('ol/format/GPX')).default;
  if (instOf(getLayerSourceFormat(layer), GPX)) {
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
export function isLayerInManager(layer: Layer<Source>): boolean {
  return (
    getShowInLayerManager(layer) === undefined ||
    getShowInLayerManager(layer) == true
  );
}

export function getSourceParams(
  source: ImageWMS | TileWMS | TileArcGISRest,
): Record<string, any> {
  return source.getParams();
}

export function getLayerParams(layer: Layer<Source>): Record<string, any> {
  const src = layer.getSource();
  if (instOf(src, ImageWMS)) {
    return getSourceParams(src as ImageWMS);
  }
  if (instOf(src, TileWMS)) {
    return getSourceParams(src as TileWMS);
  }
  if (instOf(src, TileArcGISRest)) {
    return getSourceParams(src as TileArcGISRest);
  }
}

export function updateLayerParams(layer: Layer<Source>, params: any): void {
  const src = layer.getSource();
  if (instOf(src, ImageWMS)) {
    (src as ImageWMS).updateParams(params);
  }
  if (instOf(src, TileWMS)) {
    (src as TileWMS).updateParams(params);
  }
  if (instOf(src, TileArcGISRest)) {
    (src as TileArcGISRest).updateParams(params);
  }
}

/**
 * Test if layer is has a title
 * @param layer - Layer to check
 * @returns True if layer is has a title
 */
export function hasLayerTitle(layer: Layer<Source>): boolean {
  return getTitle(layer) !== undefined && getTitle(layer) !== '';
}

/**
 * Test if layers features are editable
 * @param layer - Layer to check
 * @returns True if layer has attribute 'editor' and in it
 * 'editable' property is set to true or missing
 */
export function isLayerEditable(layer: Layer<Source>): boolean {
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
export function getLayerName(layer: Layer<Source>): string {
  if (
    layer === undefined ||
    (getShowInLayerManager(layer) !== undefined &&
      getShowInLayerManager(layer) === false)
  ) {
    return '';
  }
  const layerName = getTitle(layer) || getName(layer);
  return layerName;
}

/**
 * Highlight feature corresponding records inside a list
 * @param featuresUnder - Features under the cursor
 * @param layer - Layer to get features from
 */
export function highlightFeatures(
  featuresUnder: Feature<Geometry>[],
  list: {featureId?: string; highlighted?: boolean}[],
): void {
  const featuresUnderIds = new Set(
    featuresUnder.map((feature) => feature?.getId()).filter(Boolean),
  );

  const recordsToUpdate: {record: any; highlight: boolean}[] = [];
  for (const record of list) {
    if (!record.featureId) {
      continue;
    }

    const shouldBeHighlighted = featuresUnderIds.has(record.featureId);

    // Only update if the highlight state is changing
    if (record.highlighted !== shouldBeHighlighted) {
      recordsToUpdate.push({record, highlight: shouldBeHighlighted});
    }
  }

  if (recordsToUpdate.length > 0) {
    // Apply all updates in a batch
    for (const {record, highlight} of recordsToUpdate) {
      record.highlighted = highlight;
    }
  }
}

/**
 * Checks if layer has a VectorSource object, if layer is
 * not internal for hslayers, if it has title and is shown in layer
 * switcher
 * @param layer - Layer to check
 * @returns True if layer is drawable vector layer
 */
export function isLayerDrawable(
  layer: Layer<Source>,
  options: {checkVisible?: boolean} = {},
): boolean {
  const checkVisible = options.checkVisible ?? true;
  return (
    isLayerVectorLayer(layer, false) &&
    (checkVisible ? layer.getVisible() : true) &&
    isLayerInManager(layer) &&
    hasLayerTitle(layer) &&
    isLayerEditable(layer)
  );
}

/**
 * Checks if layer's source has its own source
 * @param layer - Layer to check
 * @returns True if layer is clustered, false otherwise
 */
export function isLayerClustered(layer: Layer<Source>): boolean {
  return isLayerVectorLayer(layer) &&
    getCluster(layer) &&
    instOf(layer.getSource(), Cluster)
    ? true
    : false;
}

/**
 * Test if layers source is loaded
 * @param layer - Selected layer descriptor
 * @returns True loaded / False not (fully) loaded
 */
export function layerLoaded(layer: HsLayerDescriptor): boolean {
  return layer.loadProgress?.loaded;
}

/**
 * Test if layers source is validly loaded (!true for invalid)
 * @param layer - Selected layer descriptor
 * @returns True invalid, false valid source
 */
export function layerInvalid(layer: HsLayerDescriptor): boolean {
  if (!layer.layer?.getSource()) {
    return true;
  }
  return layer.loadProgress?.error;
}

export function calculateResolutionFromScale(denominator: number, view: View) {
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
export function listNumericAttributes(features: Feature[]) {
  return listAttributes(features, true);
}

export const ATTRIBUTES_EXCLUDED_FROM_LIST = [
  'geometry',
  'hs_normalized_IDW_value',
];

/**
 * List all attributes of the features apart from the geometry
 * Samples up to 33% of features with a hard limit of 400 features
 * to build a comprehensive attribute list
 */
export function listAttributes(
  features: Feature[],
  numericOnly = false,
  customExcludedAttributes?: string[],
): string[] {
  if (features.length === 0) {
    return [];
  }

  const excludedAttributes =
    customExcludedAttributes || ATTRIBUTES_EXCLUDED_FROM_LIST;

  // Calculate sample size (33% with max 400)
  const sampleSize = Math.min(
    Math.ceil(features.length * 0.33),
    400,
    features.length,
  );

  const attributeSet = new Set<string>();
  const step = Math.max(1, Math.floor(features.length / sampleSize));

  // Collect attributes using reservoir sampling
  for (let i = 0; i < features.length; i += step) {
    const feature = features[i];
    Object.keys(feature.getProperties()).reduce((set, attr) => {
      if (
        !excludedAttributes.includes(attr) &&
        (!numericOnly || !isNaN(Number(feature.get(attr))))
      ) {
        set.add(attr);
      }
      return set;
    }, attributeSet);

    if (attributeSet.size >= sampleSize) {
      break;
    }
  }

  return Array.from(attributeSet);
}

// Coefficients of the polynomial (in reverse order for easy use in the loop)
export const COEFFICIENTS: Big[] = [
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
export function getPolynomialBufferFactor(x: number): number {
  // Convert x to a Big object
  const xBig = new Big(x);
  // Calculate polynomial value using Horner's method with a for...of loop
  let result = new Big(0);
  for (const coefficient of COEFFICIENTS) {
    result = result.times(xBig).plus(coefficient);
  }

  // Return the result as a regular, positive JavaScript number
  return Math.abs(result.toNumber());
}

/**
 * Buffer extent by `BUFFER_FACTOR`
 * NOTE: Not using OL because we want to extend width and height independently
 */
export function bufferExtent(extent: Extent, currentMapProj: Projection) {
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
      ? getPolynomialBufferFactor(diagonalLength / 1000) //convert to kilometers
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

  const [extMinX, extMinY, extMaxX, extMaxY] = extended;
  // If the extent is geometrically invalid, use the projection bounds
  if (extMaxX <= extMinX || extMaxY <= extMinY) {
    console.warn(
      'Invalid extent geometry detected, using projection bounds:',
      extended,
    );
    return [pMinX, pMinY, pMaxX, pMaxY];
  }

  return transformExtent(extended, 'EPSG:4087', currentMapProj);
}
