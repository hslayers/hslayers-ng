import Feature from 'ol/Feature';
import LayerGroup from 'ol/layer/Group';
import {Geometry} from 'ol/geom';
import {Group, Layer} from 'ol/layer';
import {Source} from 'ol/source';

import {DOMFeatureLink} from './dom-feature-link.type';
import {HsLaymanLayerDescriptor} from '../components/save-map/interfaces/layman-layer-descriptor.interface';
import {accessRightsModel} from '../components/add-data/common/access-rights.model';
import BaseLayer from 'ol/layer/Base';

const ABSTRACT = 'abstract';
const ACCESS_RIGHTS = 'access_rights';
const ACTIVE = 'active';
const ATTRIBUTION = 'attribution';
const AUTO_LEGEND = 'autoLegend';
const BASE = 'base';
const CAPABILITIES = 'capabilities';
const CLUSTER = 'cluster';
const CUSTOM_INFO_TEMPLATE = 'customInfoTemplate';
const DEFINITION = 'definition';
const DIMENSIONS = 'dimensions';
const EDITOR = 'editor';
const ENABLEPROXY = 'enableProxy';
const EVENTS_SUSPENDED = 'eventsSuspended';
const EXCLUSIVE = 'exclusive';
const FEATURE_INFO_LANG = 'featureInfoLang';
const FROM_COMPOSITION = 'fromComposition';
const GET_FEATURE_INFO_TARGET = 'getFeatureInfoTarget';
const HS_LAYMAN_SYNCHRONIZING = 'hsLaymanSynchronizing';
const HS_QML = 'qml';
const HS_SLD = 'sld';
const INFO_FORMAT = 'infoFormat';
const INLINE_LEGEND = 'inlineLegend';
const LAYMAN_LAYER_DESCRIPTOR = 'laymanLayerDescriptor';
const LEGENDS = 'legends';
const MAX_RESOLUTION_DENOMINATOR = 'maxResolutionDenominator';
const METADATA = 'metadata';
const MINIMUM_TERRAIN_LEVEL = 'minimumTerrainLevel';
const NAME = 'name';
const ON_FEATURE_SELECTED = 'onFeatureSelected';
const ORIG_LAYERS = 'origLayers';
const PATH = 'path';
const POPUP = 'popUp';
const POPUP_CLASS = 'popupClass';
const QUERY_CAPABILITIES = 'queryCapabilities';
const QUERY_FILTER = 'queryFilter';
const QUERYABLE = 'queryable';
const REMOVABLE = 'removable';
const SHOW_IN_LAYER_MANAGER = 'showInLayerManager';
const SUB_LAYERS = ['subLayers', 'sublayers'];
const SWIPE_SIDE = 'swipeSide';
const THUMBNAIL = 'thumbnail';
const TITLE = 'title';
const VIRTUAL_ATTRIBUTES = 'virtualAttributes';
const WFS_URL = 'wfsUrl';
const WORKSPACE = 'workspace';
export const DOM_FEATURE_LINKS = 'domFeatureLinks';

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
  widgets?: string[];
  displayFunction?: any;
};

export function getAccessRights(layer: Layer<Source>): accessRightsModel {
  return layer.get(ACCESS_RIGHTS);
}

export function setAccessRights(
  layer: Layer<Source>,
  access_rights: accessRightsModel
): void {
  layer.set(ACCESS_RIGHTS, access_rights);
}

export function setTitle(layer: Layer<Source>, title: string): void {
  layer.set(TITLE, title);
}

export function getTitle(layer: Layer<Source>): string {
  return layer.get(TITLE);
}

export function setName(layer: Layer<Source>, name: string): void {
  layer.set(NAME, name);
}

export function getName(layer: Layer<Source>): string {
  return layer.get(NAME);
}

export function setAbstract(layer: Layer<Source>, abstract: string): void {
  layer.set(ABSTRACT, abstract);
}

export function getAbstract(layer: Layer<Source>): string {
  return layer.get(ABSTRACT);
}

export function setActive(group: Group, active: boolean): void {
  group.set(ACTIVE, active);
}

export function getActive(group: Group): boolean {
  return group.get(ACTIVE);
}

export function setAttribution(
  layer: Layer<Source>,
  attribution: Attribution
): void {
  layer.set(ATTRIBUTION, attribution);
}

export function getAttribution(layer: Layer<Source>): Attribution {
  return layer.get(ATTRIBUTION);
}

export function setAutoLegend(layer: Layer<Source>, value: boolean): void {
  layer.set(AUTO_LEGEND, value);
}

export function getAutoLegend(layer: Layer<Source>): boolean {
  return layer.get(AUTO_LEGEND);
}

export function getCachedCapabilities(layer: Layer<Source>): any {
  return layer.get(CAPABILITIES);
}

export function setCacheCapabilities(
  layer: Layer<Source>,
  capabilities: any
): void {
  layer.set(CAPABILITIES, capabilities);
}

export function setBase(layer: Layer<Source>, base: boolean): void {
  layer.set(BASE, base);
}

export function getBase(layer: Layer<Source>): boolean {
  return layer.get(BASE);
}

export function setCluster(layer: Layer<Source>, clusterActive: boolean): void {
  layer.set(CLUSTER, clusterActive);
}

export function getCluster(layer: Layer<Source>): boolean {
  return layer.get(CLUSTER);
}

export function setCustomInfoTemplate(
  layer: Layer<Source>,
  customInfoTemplate: string
): void {
  layer.set(CUSTOM_INFO_TEMPLATE, customInfoTemplate);
}

export function getCustomInfoTemplate(layer: Layer<Source>): string {
  return layer.get(CUSTOM_INFO_TEMPLATE);
}

export function setDefinition(
  layer: Layer<Source>,
  definition: Definition
): void {
  layer.set(DEFINITION, definition);
}

export function getDefinition(layer: Layer<Source>): Definition {
  return layer.get(DEFINITION);
}

export interface Dimension {
  label: string;
  onlyInEditor?: boolean;
  type?: 'datetime' | 'date';
  value?: any;
  default?: any;
  units?: string;
  /**
   * Can be represented either by an array of values or, in case of time, as a ISO8601 time definition
   */
  values?: any[] | string;
  availability?(): boolean;
}

export interface DimensionsList {
  [key: string]: Dimension;
}

/**
 * Set the dimensions definition. TODO: Extend description
 * @param layer - OL layer
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
export function setDimensions(
  layer: Layer<Source>,
  dimensions: DimensionsList
): void {
  layer.set(DIMENSIONS, dimensions);
}

export function getDimensions(layer: Layer<Source>): DimensionsList {
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
  layer: Layer<Source>,
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
export function getDimension(layer: Layer<Source>, type: string): Dimension {
  return layer.get(DIMENSIONS) ? layer.get(DIMENSIONS)[type] : undefined;
}

export function setDomFeatureLinks(
  layer: Layer<Source>,
  domFeatureLinks: DOMFeatureLink[]
): void {
  layer.set(DOM_FEATURE_LINKS, domFeatureLinks);
}

export function getDomFeatureLinks(layer: BaseLayer): DOMFeatureLink[] {
  return layer.get(DOM_FEATURE_LINKS);
}

export function setEditor(layer: Layer<Source>, editor: Editor): void {
  layer.set(EDITOR, editor);
}

export function getEditor(layer: Layer<Source>): Editor {
  return layer.get(EDITOR);
}

export function setEnableProxy(
  layer: Layer<Source>,
  enableProxy: boolean
): void {
  layer.set(ENABLEPROXY, enableProxy);
}

export function getEnableProxy(layer: Layer<Source>): boolean {
  return layer.get(ENABLEPROXY);
}

export function setEventsSuspended(
  layer: Layer<Source>,
  eventsSuspended: number
): void {
  layer.set(EVENTS_SUSPENDED, eventsSuspended);
}

export function getEventsSuspended(layer: Layer<Source>): number {
  return layer.get(EVENTS_SUSPENDED);
}

export function setExclusive(layer: Layer<Source>, exclusive: boolean): void {
  layer.set(EXCLUSIVE, exclusive);
}

export function getExclusive(layer: Layer<Source>): boolean {
  return layer.get(EXCLUSIVE);
}

export function setFeatureInfoLang(
  layer: Layer<Source>,
  featureInfoLang: any
): void {
  layer.set(FEATURE_INFO_LANG, featureInfoLang);
}

export function getFeatureInfoLang(layer: Layer<Source>): any {
  return layer.get(FEATURE_INFO_LANG);
}

export function setFromComposition(
  layer: Layer<Source>,
  fromComposition: boolean
): void {
  layer.set(FROM_COMPOSITION, fromComposition);
}

export function getFromComposition(layer: Layer<Source>): boolean {
  return layer.get(FROM_COMPOSITION);
}

export function setFeatureInfoTarget(
  layer: Layer<Source>,
  featureInfoTarget: string
): void {
  layer.set(GET_FEATURE_INFO_TARGET, featureInfoTarget);
}

export function getFeatureInfoTarget(layer: Layer<Source>): string {
  return layer.get(GET_FEATURE_INFO_TARGET);
}

export function getSld(layer: Layer<Source>): string {
  return layer.get(HS_SLD);
}

export function getQml(layer: Layer<Source>): string {
  return layer.get(HS_QML);
}

export function setSld(layer: Layer<Source>, sld: string): void {
  layer.set(HS_SLD, sld);
}

export function setHsLaymanSynchronizing(
  layer: Layer<Source>,
  hsLaymanSynchronizing: boolean
): void {
  layer.set(HS_LAYMAN_SYNCHRONIZING, hsLaymanSynchronizing);
}

export function getHsLaymanSynchronizing(layer: Layer<Source>): boolean {
  return layer.get(HS_LAYMAN_SYNCHRONIZING);
}

export function setInfoFormat(layer: Layer<Source>, infoFormat: string): void {
  layer.set(INFO_FORMAT, infoFormat);
}

export function getInfoFormat(layer: Layer<Source>): string {
  return layer.get(INFO_FORMAT);
}

export function setInlineLegend(
  layer: Layer<Source>,
  inlineLegend: boolean
): void {
  layer.set(INLINE_LEGEND, inlineLegend);
}

export function getInlineLegend(layer: Layer<Source>): boolean {
  return layer.get(INLINE_LEGEND);
}

export function setLaymanLayerDescriptor(
  layer: Layer<Source>,
  hsLaymanLayerDescriptor: HsLaymanLayerDescriptor
): void {
  layer.set(LAYMAN_LAYER_DESCRIPTOR, hsLaymanLayerDescriptor);
}

export function getLaymanLayerDescriptor(
  layer: Layer<Source>
): HsLaymanLayerDescriptor {
  return layer.get(LAYMAN_LAYER_DESCRIPTOR);
}

export function setLegends(
  layer: Layer<Source>,
  path: string | string[]
): void {
  layer.set(LEGENDS, path);
}

export function getLegends(layer: Layer<Source>): string | string[] {
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
  layer: Layer<Source>,
  maxResolutionDenominator: number
): void {
  layer.set(MAX_RESOLUTION_DENOMINATOR, maxResolutionDenominator);
}

export function getMaxResolutionDenominator(layer: Layer<Source>): number {
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
 * @param layer -
 * @param metadata -
 */
export function setMetadata(layer: Layer<Source>, metadata: Metadata): void {
  layer.set(METADATA, metadata);
}

export function getMetadata(layer: Layer<Source>): Metadata {
  return layer.get(METADATA);
}

export function setMinimumTerrainLevel(
  layer: Layer<Source>,
  minimumTerrainLevel: number
): void {
  layer.set(MINIMUM_TERRAIN_LEVEL, minimumTerrainLevel);
}

export function getMinimumTerrainLevel(layer: Layer<Source>): number {
  return layer.get(MINIMUM_TERRAIN_LEVEL);
}

interface FeatureSelector {
  (feature: Feature<Geometry>): void;
}

export function setOnFeatureSelected(
  layer: Layer<Source>,
  onFeatureSelected: FeatureSelector
): void {
  layer.set(ON_FEATURE_SELECTED, onFeatureSelected);
}

export function getOnFeatureSelected(layer: Layer<Source>): FeatureSelector {
  return layer.get(ON_FEATURE_SELECTED);
}

/**
 * Used internaly by hslayers. Store the original LAYERS param
 * when overriding LAYERS by subLayers property. This is needed for metadata
 * parsing after page has refreshed and LAYERS are read from cookie or map compositions.
 * @param layer - OL layer
 * @param origLayers - Comma separated list of layer names OR 1 container layer name
 */
export function setOrigLayers(layer: Layer<Source>, origLayers: string): void {
  layer.set(ORIG_LAYERS, origLayers);
}

export function getOrigLayers(layer: Layer<Source>): string {
  return layer.get(ORIG_LAYERS);
}

export function setPath(layer: Layer<Source>, path: string): void {
  layer.set(PATH, path);
}

export function getPath(layer: Layer<Source>): string {
  return layer.get(PATH);
}

export function setPopUp(layer: Layer<Source>, popUp: popUp): void {
  layer.set(POPUP, popUp);
}

export function getPopUp(layer: Layer<Source>): popUp {
  return layer.get(POPUP);
}

export function setPopupClass(layer: Layer<Source>, popupClass: string): void {
  layer.set(POPUP_CLASS, popupClass);
}

export function getPopupClass(layer: Layer<Source>): string {
  return layer.get(POPUP_CLASS);
}

export function setQueryable(layer: Layer<Source>, queryable: boolean): void {
  layer.set(QUERYABLE, queryable);
}

export function getQueryable(layer: Layer<Source>): boolean {
  return layer.get(QUERYABLE);
}

export function setQueryCapabilities(
  layer: Layer<Source>,
  queryCapabilities: boolean
): void {
  layer.set(QUERY_CAPABILITIES, queryCapabilities);
}

export function getQueryCapabilities(layer: Layer<Source>): boolean {
  return layer.get(QUERY_CAPABILITIES);
}

export function setQueryFilter(layer: Layer<Source>, queryFilter: any): void {
  layer.set(QUERY_FILTER, queryFilter);
}

export function getQueryFilter(layer: Layer<Source>): any {
  return layer.get(QUERY_FILTER);
}

export function setRemovable(layer: Layer<Source>, removable: boolean): void {
  layer.set(REMOVABLE, removable);
}

export function getRemovable(layer: Layer<Source>): boolean {
  return layer.get(REMOVABLE);
}

export function setShowInLayerManager(
  layer: Layer<Source>,
  showInLayerManager: boolean
): void {
  layer.set(SHOW_IN_LAYER_MANAGER, showInLayerManager);
}

export function getShowInLayerManager(layer: BaseLayer): boolean {
  return layer.get(SHOW_IN_LAYER_MANAGER);
}

/**
 * Set list of all possible sub-layers for WMS.
 * This is used to limit the displayed sub-layers on the map.
 * If sublayers property is set, the sub-layer tree in layer manager is
 * hidden, otherwise all sub-layers are shown.
 * @param layer -
 * @param subLayers - String of all possible WMS layers sub-layer names separated by comma
 */
export function setSubLayers(layer: Layer<Source>, subLayers: string): void {
  layer.set(SUB_LAYERS[0], subLayers);
}

/**
 * Get list of all possible sub-layers for WMS.
 * This is used to limit the displayed sub-layers on the map.
 * If sub-layers property is set, the sub-layer tree in layer manager is
 * hidden, otherwise all sub-layers are shown.
 * @param layer -
 */
export function getSubLayers(layer: Layer<Source>): string {
  return layer.get(SUB_LAYERS[0]) ?? layer.get(SUB_LAYERS[1]);
}

export function setThumbnail(layer: Layer<Source>, thumbnail: string): void {
  layer.set(THUMBNAIL, thumbnail);
}

export function getThumbnail(layer: Layer<Source> | LayerGroup): string {
  return layer.get(THUMBNAIL);
}

export function setVirtualAttributes(
  layer: Layer<Source>,
  virtualAttributes: any
): void {
  layer.set(VIRTUAL_ATTRIBUTES, virtualAttributes);
}

export function getVirtualAttributes(layer: Layer<Source>): any {
  return layer.get(VIRTUAL_ATTRIBUTES);
}

export function getWorkspace(layer: Layer<Source>): string {
  return layer.get(WORKSPACE);
}

export function setWorkspace(layer: Layer<Source>, workspace: string): void {
  layer.set(WORKSPACE, workspace);
}

export function getWfsUrl(layer: Layer<Source>): string {
  return layer.get(WFS_URL);
}

export function setWfsUrl(layer: Layer<Source>, url: string): void {
  layer.set(WFS_URL, url);
}

export function getSwipeSide(layer: Layer<Source>): 'left' | 'right' {
  return layer.get(SWIPE_SIDE);
}

export function setSwipeSide(
  layer: Layer<Source>,
  side: 'left' | 'right'
): void {
  layer.set(SWIPE_SIDE, side);
}

export const HsLayerExt = {
  getAccessRights,
  setAccessRights,
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
  setDefinition,
  getDefinition,
  setDimensions,
  getDimensions,
  getDomFeatureLinks,
  setDomFeatureLinks,
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
  setWorkspace,
  getWorkspace,
  getWfsUrl,
  setWfsUrl,
  getSwipeSide,
  setSwipeSide,
};
