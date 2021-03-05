import Feature from 'ol/Feature';
import {Group, Layer} from 'ol/layer';
import {HsLaymanLayerDescriptor} from '../components/save-map/layman-layer-descriptor.interface';
import {Style} from 'ol/style';

const TITLE = 'title';
const NAME = 'name';
const ABSTRACT = 'abstract';
const ACTIVE = 'active';
const ATTRIBUTION = 'attribution';
const CAPABILITIES = 'capabilities';
const BASE = 'base';
const CLUSTER = 'cluster';
const CUSTOM_INFO_TEMPLATE = 'customInfoTemplate';
const DECLUTTER = 'declutter';
const DEFINITION = 'definition';
const DIMENSIONS = 'dimensions';
const EDITOR = 'editor';
const ENABLEPROXY = 'enableProxy';
const EVENTS_SUSPENDED = 'eventsSuspended';
const EXCLUSIVE = 'exclusive';
const FEATURE_INFO_LANG = 'featureInfoLang';
const FROM_COMPOSITION = 'fromComposition';
const GET_FEATURE_INFO_TARGET = 'getFeatureInfoTarget';
const HS_ORIGINAL_STYLE = 'hsOriginalStyle';
const HS_LAYMAN_SYNCHRONIZING = 'hsLaymanSynchronizing';
const INFO_FORMAT = 'infoFormat';
const INLINE_LEGEND = 'inlineLegend';
const LAYMAN_LAYER_DESCRIPTOR = 'laymanLayerDescriptor';
const MAX_RESOLUTION_DENOMINATOR = 'maxResolutionDenominator';
const METADATA = 'metadata';
const MINIMUM_TERRAIN_LEVEL = 'minimumTerrainLevel';
const ON_FEATURE_SELECTED = 'onFeatureSelected';
const PATH = 'path';
const POPUP = 'popUp';
const POPUP_CLASS = 'popupClass';
const QUERYABLE = 'queryable';
const QUERY_CAPABILITIES = 'queryCapabilities';
const QUERY_FILTER = 'queryFilter';
const REMOVABLE = 'removable';
const SHOW_IN_LAYER_MANAGER = 'showInLayerManager';
const THUMBNAIL = 'thumbnail';
const VIRTUAL_ATTRIBUTES = 'virtualAttributes';
const LEGENDS = 'legends';
const SUB_LAYERS = 'sublayers';

export type Attribution = {
  onlineResource?: string;
  title?: string;
  logoUrl?: {
    format?: string;
    onlineResource?: string;
  };
  /**
   * If set to true even if get capabilities receives some attribution,
   * it will not be updated and existing hardcoded attribution will be used
   */
  locked?: boolean;
};
export type Definition = {
  format?: string;
  url?: string;
};
export type Editor = {
  editable?: boolean;
  /**
   * Object of key value pairs where key is the attribute name and value
   * is the default attribute value to set
   */
  defaultAttributes?: any;
};
export type popUpAttribute = {
  attribute: string;
  displayFunction?: any;
  label?: string;
};
export type popUp = {
  attributes?: Array<popUpAttribute | string>;
};
export function setTitle(layer: Layer, title: string): void {
  layer.set(TITLE, title);
}

export function getTitle(layer: Layer): string {
  return layer.get(TITLE);
}

export function setName(layer: Layer, name: string): void {
  layer.set(NAME, name);
}

export function getName(layer: Layer): string {
  return layer.get(NAME);
}

export function setAbstract(layer: Layer, abstract: string): void {
  layer.set(ABSTRACT, abstract);
}

export function getAbstract(layer: Layer): string {
  return layer.get(ABSTRACT);
}

export function setActive(group: Group, active: boolean): void {
  group.set(ACTIVE, active);
}

export function getActive(group: Group): boolean {
  return group.get(ACTIVE);
}

export function setAttribution(layer: Layer, attribution: Attribution): void {
  layer.set(ATTRIBUTION, attribution);
}

export function getAttribution(layer: Layer): Attribution {
  return layer.get(ATTRIBUTION);
}

export function getCachedCapabilities(layer: Layer): any {
  return layer.get(CAPABILITIES);
}

export function setCacheCapabilities(layer: Layer, capabilities: any): void {
  layer.set(CAPABILITIES, capabilities);
}

export function setBase(layer: Layer, base: boolean): void {
  layer.set(BASE, base);
}

export function getBase(layer: Layer): boolean {
  return layer.get(BASE);
}

export function setCluster(layer: Layer, clusterActive: boolean): void {
  layer.set(CLUSTER, clusterActive);
}

export function getCluster(layer: Layer): boolean {
  return layer.get(CLUSTER);
}

export function setCustomInfoTemplate(
  layer: Layer,
  customInfoTemplate: string
): void {
  layer.set(CUSTOM_INFO_TEMPLATE, customInfoTemplate);
}

export function getCustomInfoTemplate(layer: Layer): string {
  return layer.get(CUSTOM_INFO_TEMPLATE);
}

export function setDeclutter(layer: Layer, declutterActive: boolean): void {
  layer.set(DECLUTTER, declutterActive);
}

export function getDeclutter(layer: Layer): boolean {
  return layer.get(DECLUTTER);
}

export function setDefinition(layer: Layer, definition: Definition): void {
  layer.set(DEFINITION, definition);
}

export function getDefinition(layer: Layer): Definition {
  return layer.get(DEFINITION);
}

export interface Dimension {
  label: string;
  onlyInEditor?: boolean;
  type?: 'datetime' | 'date';
  value?: any;
  default?: any;
  values?: any[];
  availability?(): boolean;
}

export interface DimensionsList {
  [key: string]: Dimension;
}

/**
 * Set the dimensions defintion. TODO: Extend description
 * @param layer 
 * @param dimensions
 * @example
 *  dimensions: \{
      time: \{ label: 'Local time', default: '2020-02-25T01:00' \},
      level: \{
        label: 'Level hPa',
        value: 'surface',
        values: ['surface', '950mb - 500m', '900mb - 1km'],
        availability: function(layer) \{
          return layer.get('title') != 'Temperature observations'
        \}
      \}
    \}
 */
export function setDimensions(layer: Layer, dimensions: DimensionsList): void {
  layer.set(DIMENSIONS, dimensions);
}

export function getDimensions(layer: Layer): DimensionsList {
  return layer.get(DIMENSIONS);
}

/**
 * If no dimensions are defined then creates a new dimension object,
 * if dimensions exist but the type is not present yet, it appends that dimension,
 * if dimensions exist and the type is present already, it replaces that dimension
 * @param layer - OL layer object
 * @param dimension - a dimension definition object
 * @param type - dimension type, e.g. 'time', 'height', etc.
 */
export function setDimension(
  layer: Layer,
  dimension: Dimension,
  type: string
): void {
  if (layer.get(DIMENSIONS)) {
    const dims = layer.get(DIMENSIONS);
    dims[type] = dimension;
    layer.set(DIMENSIONS, dims);
  } else {
    layer.set(DIMENSIONS, {[type]: dimension});
  }
}

/**
 * @param layer - OL layer object
 * @param type - dimension type, e.g. 'time', 'height', etc.
 * @returns Single dimension object definition
 */
export function getDimension(layer: Layer, type: string): Dimension {
  return layer.get(DIMENSIONS) ? layer.get(DIMENSIONS)[type] : undefined;
}

export function setEditor(layer: Layer, editor: Editor): void {
  layer.set(EDITOR, editor);
}

export function getEditor(layer: Layer): Editor {
  return layer.get(EDITOR);
}

export function setEnableProxy(layer: Layer, enableProxy: boolean): void {
  layer.set(ENABLEPROXY, enableProxy);
}

export function getEnableProxy(layer: Layer): boolean {
  return layer.get(ENABLEPROXY);
}

export function setEventsSuspended(
  layer: Layer,
  eventsSuspended: number
): void {
  layer.set(EVENTS_SUSPENDED, eventsSuspended);
}

export function getEventsSuspended(layer: Layer): number {
  return layer.get(EVENTS_SUSPENDED);
}

export function setExclusive(layer: Layer, exclusive: boolean): void {
  layer.set(EXCLUSIVE, exclusive);
}

export function getExclusive(layer: Layer): boolean {
  return layer.get(EXCLUSIVE);
}

export function setFeatureInfoLang(layer: Layer, featureInfoLang: any): void {
  layer.set(FEATURE_INFO_LANG, featureInfoLang);
}

export function getFeatureInfoLang(layer: Layer): any {
  return layer.get(FEATURE_INFO_LANG);
}

export function setFromComposition(
  layer: Layer,
  fromCompostion: boolean
): void {
  layer.set(FROM_COMPOSITION, fromCompostion);
}

export function getFromComposition(layer: Layer): boolean {
  return layer.get(FROM_COMPOSITION);
}

export function setFeatureInfoTarget(
  layer: Layer,
  featureInfoTarget: string
): void {
  layer.set(GET_FEATURE_INFO_TARGET, featureInfoTarget);
}

export function getFeatureInfoTarget(layer: Layer): string {
  return layer.get(GET_FEATURE_INFO_TARGET);
}

export function setHsOriginalStyle(layer: Layer, hsOriginalStyle: Style): void {
  layer.set(HS_ORIGINAL_STYLE, hsOriginalStyle);
}

export function getHsOriginalStyle(layer: Layer): Style {
  return layer.get(HS_ORIGINAL_STYLE);
}

export function setHsLaymanSynchronizing(
  layer: Layer,
  hsLaymanSynchronizing: boolean
): void {
  layer.set(HS_LAYMAN_SYNCHRONIZING, hsLaymanSynchronizing);
}

export function getHsLaymanSynchronizing(layer: Layer): boolean {
  return layer.get(HS_LAYMAN_SYNCHRONIZING);
}

export function setInfoFormat(layer: Layer, infoFormat: string): void {
  layer.set(INFO_FORMAT, infoFormat);
}

export function getInfoFormat(layer: Layer): string {
  return layer.get(INFO_FORMAT);
}

export function setInlineLegend(layer: Layer, inlineLegend: boolean): void {
  layer.set(INLINE_LEGEND, inlineLegend);
}

export function getInlineLegend(layer: Layer): boolean {
  return layer.get(INLINE_LEGEND);
}

export function setLaymanLayerDescriptor(
  layer: Layer,
  hsLaymanLayerDescriptor: HsLaymanLayerDescriptor
): void {
  layer.set(LAYMAN_LAYER_DESCRIPTOR, hsLaymanLayerDescriptor);
}

export function getLaymanLayerDescriptor(
  layer: Layer
): HsLaymanLayerDescriptor {
  return layer.get(LAYMAN_LAYER_DESCRIPTOR);
}

export function setLegends(layer: Layer, path: string | string[]): void {
  layer.set(LEGENDS, path);
}

export function getLegends(layer: Layer): string | string[] {
  if (
    layer.get(LEGENDS) == undefined &&
    layer.get('legendImage') !== undefined
  ) {
    console.warn(
      '"legendImage" layer property is deprecated in favor of "legends"'
    );
    return layer.get('legendImage');
  }
  return layer.get(LEGENDS);
}

export function setMaxResolutionDenominator(
  layer: Layer,
  maxResolutionDenominator: number
): void {
  layer.set(MAX_RESOLUTION_DENOMINATOR, maxResolutionDenominator);
}

export function getMaxResolutionDenominator(layer: Layer): number {
  return layer.get(MAX_RESOLUTION_DENOMINATOR);
}

export type MetadataUrl = {
  type?: string;
  format?: string;
  onlineResource?: string;
};

export type Metadata = {
  id?: string | number;
  urls?: MetadataUrl[];
  styles?: any;
};

/**
 * Store metadata which were parsed from layer definition in composition json.
 * @param layer
 * @param metadata
 */
export function setMetadata(layer: Layer, metadata: Metadata): void {
  layer.set(METADATA, metadata);
}

export function getMetadata(layer: Layer): Metadata {
  return layer.get(METADATA);
}

export function setMinimumTerrainLevel(
  layer: Layer,
  minimumTerrainLevel: number
): void {
  layer.set(MINIMUM_TERRAIN_LEVEL, minimumTerrainLevel);
}

export function getMinimumTerrainLevel(layer: Layer): number {
  return layer.get(MINIMUM_TERRAIN_LEVEL);
}

interface FeatureSelector {
  (feature: Feature): void;
}

export function setOnFeatureSelected(
  layer: Layer,
  onFeatureSelected: FeatureSelector
): void {
  layer.set(ON_FEATURE_SELECTED, onFeatureSelected);
}

export function getOnFeatureSelected(layer: Layer): FeatureSelector {
  return layer.get(ON_FEATURE_SELECTED);
}

export function setPath(layer: Layer, path: string): void {
  layer.set(PATH, path);
}

export function getPath(layer: Layer): string {
  return layer.get(PATH);
}

export function setPopUp(layer: Layer, popUp: popUp): void {
  layer.set(POPUP, popUp);
}

export function getPopUp(layer: Layer): popUp {
  return layer.get(POPUP);
}

export function setPopupClass(layer: Layer, popupClass: string): void {
  layer.set(POPUP_CLASS, popupClass);
}

export function getPopupClass(layer: Layer): string {
  return layer.get(POPUP_CLASS);
}

export function setQueryable(layer: Layer, queryable: boolean): void {
  layer.set(QUERYABLE, queryable);
}

export function getQueryable(layer: Layer): boolean {
  return layer.get(QUERYABLE);
}

export function setQueryCapabilities(
  layer: Layer,
  queryCapabilities: boolean
): void {
  layer.set(QUERY_CAPABILITIES, queryCapabilities);
}

export function getQueryCapabilities(layer: Layer): boolean {
  return layer.get(QUERY_CAPABILITIES);
}

export function setQueryFilter(layer: Layer, queryFilter: any): void {
  layer.set(QUERY_FILTER, queryFilter);
}

export function getQueryFilter(layer: Layer): any {
  return layer.get(QUERY_FILTER);
}

export function setRemovable(layer: Layer, removable: boolean): void {
  layer.set(REMOVABLE, removable);
}

export function getRemovable(layer: Layer): boolean {
  return layer.get(REMOVABLE);
}

export function setShowInLayerManager(
  layer: Layer,
  showInLayerManager: boolean
): void {
  layer.set(SHOW_IN_LAYER_MANAGER, showInLayerManager);
}

export function getShowInLayerManager(layer: Layer): boolean {
  return layer.get(SHOW_IN_LAYER_MANAGER);
}

/**
 * Set list of all possible sub-layers for WMS
 * @param layer
 * @param sublayers String of all possible WMS layers sub-layer names separated by comma
 */
export function setSubLayers(layer: Layer, sublayers: string): void {
  layer.set(SUB_LAYERS, sublayers);
}

/**
 * Get list of all possible sub-layers for WMS
 * @param layer
 */
export function getSubLayers(layer: Layer): string {
  return layer.get(SUB_LAYERS);
}

export function setThumbnail(layer: Layer, thumbnail: string): void {
  layer.set(THUMBNAIL, thumbnail);
}

export function getThumbnail(layer: Layer): string {
  return layer.get(THUMBNAIL);
}

export function setVirtualAttributes(
  layer: Layer,
  virtualAttributes: any
): void {
  layer.set(VIRTUAL_ATTRIBUTES, virtualAttributes);
}

export function getVirtualAttributes(layer: Layer): any {
  return layer.get(VIRTUAL_ATTRIBUTES);
}
export const HsLayerExt = {
  setTitle,
  getTitle,
  setName,
  getName,
  setAbstract,
  getAbstract,
  setActive,
  getActive,
  setAttribution,
  getAttribution,
  setCacheCapabilities,
  getCachedCapabilities,
  setBase,
  getBase,
  setCluster,
  getCluster,
  setCustomInfoTemplate,
  getCustomInfoTemplate,
  setDeclutter,
  getDeclutter,
  setDefinition,
  getDefinition,
  setDimensions,
  getDimensions,
  setEditor,
  getEditor,
  setEnableProxy,
  getEnableProxy,
  setEventsSuspended,
  getEventsSuspended,
  setExclusive,
  getExclusive,
  setFeatureInfoLang,
  getFeatureInfoLang,
  setFromComposition,
  getFromComposition,
  setFeatureInfoTarget,
  getFeatureInfoTarget,
  setHsOriginalStyle,
  getHsOriginalStyle,
  setHsLaymanSynchronizing,
  getHsLaymanSynchronizing,
  setInfoFormat,
  getInfoFormat,
  setInlineLegend,
  getInlineLegend,
  setLaymanLayerDescriptor,
  getLaymanLayerDescriptor,
  setMaxResolutionDenominator,
  getMaxResolutionDenominator,
  setMetadata,
  getMetadata,
  setMinimumTerrainLevel,
  getMinimumTerrainLevel,
  setOnFeatureSelected,
  getOnFeatureSelected,
  setPath,
  getPath,
  setPopUp,
  getPopUp,
  setPopupClass,
  getPopupClass,
  setQueryable,
  getQueryable,
  setQueryCapabilities,
  getQueryCapabilities,
  setQueryFilter,
  getQueryFilter,
  setRemovable,
  getRemovable,
  setShowInLayerManager,
  getShowInLayerManager,
  setThumbnail,
  getThumbnail,
  setVirtualAttributes,
  getVirtualAttributes,
};
