import {Group, Layer} from 'ol/layer';
import {Style} from 'ol/style';

const TITLE = 'title';
const NAME = 'name';
const ABSTRACT = 'abstract';
const ACTIVE = 'active';
const ATTRIBUTION = 'attribution';
const CAPABILITIES = 'capabilities';
const BASE = 'base';
const BOUNDINGBOX = 'boundingBox';
const CLUSTER = 'cluster';
const CUSTOMINFOTEMPLATE = 'customInfoTemplate';
const DECLUTTER = 'declutter';
const DEFINITION = 'definition';
const DIMENSIONS = 'dimensions';
const EDITOR = 'editor';
const ENABLEPROXY = 'enableProxy';
const EVENTSSUSPENDED = 'eventsSuspended';
const EXCLUSIVE = 'exclusive';
const FEATUREINFOLANG = 'featureInfoLang';
const FROMCOMPOSITION = 'fromComposition';
const GETFEATUREINFOTARGET = 'getFeatureInfoTarget';
const HSORIGINALSTYLE = 'hsOriginalStyle';
const HSLAYMANSYNCHRONIZING = 'hsLaymanSynchronizing';
const INFOFORMAT = 'infoFormat';
const INLINELEGEND = 'inlineLegend';
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
  defaultAttributes?: any;
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

export function setBoundingBox(layer: Layer, extent: number[]): void {
  layer.set(BOUNDINGBOX, extent);
}

export function getBoundingBox(layer: Layer): Array<number> | Array<any> {
  return layer.get(BOUNDINGBOX);
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
  layer.set(CUSTOMINFOTEMPLATE, customInfoTemplate);
}

export function getCustomInfoTemplate(layer: Layer): string {
  return layer.get(CUSTOMINFOTEMPLATE);
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

export function setDimensions(layer: Layer, dimensions: any): void {
  layer.set(DIMENSIONS, dimensions);
}

export function getDimensions(layer: Layer): any {
  return layer.get(DIMENSIONS);
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
  layer.set(EVENTSSUSPENDED, eventsSuspended);
}

export function getEventsSuspended(layer: Layer): number {
  return layer.get(EVENTSSUSPENDED);
}

export function setExclusive(layer: Layer, exclusive: boolean): void {
  layer.set(EXCLUSIVE, exclusive);
}

export function getExclusive(layer: Layer): boolean {
  return layer.get(EXCLUSIVE);
}

export function setFeatureInfoLang(layer: Layer, featureInfoLang: any): void {
  layer.set(FEATUREINFOLANG, featureInfoLang);
}

export function getFeatureInfoLang(layer: Layer): any {
  return layer.get(FEATUREINFOLANG);
}

export function setFromComposition(
  layer: Layer,
  fromCompostion: boolean
): void {
  layer.set(FROMCOMPOSITION, fromCompostion);
}

export function getFromComposition(layer: Layer): boolean {
  return layer.get(FROMCOMPOSITION);
}

export function setFeatureInfoTarget(
  layer: Layer,
  featureInfoTarget: string
): void {
  layer.set(GETFEATUREINFOTARGET, featureInfoTarget);
}

export function getFeatureInfoTarget(layer: Layer): string {
  return layer.get(GETFEATUREINFOTARGET);
}

export function setHsOriginalStyle(layer: Layer, hsOriginalStyle: Style): void {
  layer.set(HSORIGINALSTYLE, hsOriginalStyle);
}

export function getHsOriginalStyle(layer: Layer): Style {
  return layer.get(HSORIGINALSTYLE);
}

export function setHsLaymanSynchronizing(
  layer: Layer,
  hsLaymanSynchronizing: boolean
): void {
  layer.set(HSLAYMANSYNCHRONIZING, hsLaymanSynchronizing);
}

export function getHsLaymanSynchronizing(layer: Layer): boolean {
  return layer.get(HSLAYMANSYNCHRONIZING);
}

export function setInfoFormat(
  layer: Layer,
  infoFormat: string
): void {
  layer.set(INFOFORMAT, infoFormat);
}

export function getInfoFormat(layer: Layer): string {
  return layer.get(INFOFORMAT);
}

export function setInlineLegend(layer: Layer, inlineLegend: boolean): void {
  layer.set(INLINELEGEND, inlineLegend);
}

export function getInlineLegend(layer: Layer): boolean {
  return layer.get(INLINELEGEND);
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
  setBoundingBox,
  getBoundingBox,
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
};
