import Feature from 'ol/Feature';

const TITLE = 'title';
const HIGHLIGHTED = 'highlighted';
const LABEL = 'label';
const NAME = 'name';
const RECORD = 'record';
const FEATURES = 'features';
const UNITID = 'unitId';

export function setFeatureTitle(feature: Feature, title: string): void {
  feature.set(TITLE, title);
}

export function getFeatureTitle(feature: Feature): string {
  return feature.get(TITLE);
}

export function setHighlighted(feature: Feature, highlighted: boolean): void {
  feature.set(HIGHLIGHTED, highlighted);
}

export function getHighlighted(feature: Feature): boolean {
  return feature.get(HIGHLIGHTED);
}

export function setFeatureLabel(feature: Feature, label: string): void {
  feature.set(LABEL, label);
}

export function getFeatureLabel(feature: Feature): string {
  return feature.get(LABEL);
}

export function setFeatureName(feature: Feature, name: string): void {
  feature.set(NAME, name);
}

export function getFeatureName(feature: Feature): string {
  return feature.get(NAME);
}

export function setRecord(feature: Feature, record: any): void {
  feature.set(RECORD, record);
}

export function getRecord(feature: Feature): any {
  return feature.get(RECORD);
}

export function setFeatures(feature: Feature, features: Array<Feature>): void {
  feature.set(FEATURES, features);
}

export function getFeatures(feature: Feature): Array<Feature> {
  return feature.get(FEATURES);
}

export function setUnitId(feature: Feature, unitId: string | number): void {
  feature.set(UNITID, unitId);
}

export function getUnitId(feature: Feature): string | number {
  return feature.get(UNITID);
}

export const HsFeatureExt = {
  setFeatureTitle,
  getFeatureTitle,
  setHighlighted,
  getHighlighted,
  setFeatureLabel,
  getFeatureLabel,
  setFeatureName,
  getFeatureName,
  setRecord,
  getRecord,
  setFeatures,
  getFeatures,
  setUnitId,
  getUnitId,
};
