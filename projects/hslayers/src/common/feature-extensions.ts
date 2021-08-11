import Feature from 'ol/Feature';
import {Geometry} from 'ol/geom';

const TITLE = 'title';
const HIGHLIGHTED = 'highlighted';
const LABEL = 'label';
const NAME = 'name';
const RECORD = 'record';
const FEATURES = 'features';
const UNITID = 'unitId';

export function setFeatureTitle(
  feature: Feature<Geometry>,
  title: string
): void {
  feature.set(TITLE, title);
}

export function getFeatureTitle(feature: Feature<Geometry>): string {
  return feature.get(TITLE);
}

export function setHighlighted(
  feature: Feature<Geometry>,
  highlighted: boolean
): void {
  feature.set(HIGHLIGHTED, highlighted);
}

export function getHighlighted(feature: Feature<Geometry>): boolean {
  return feature.get(HIGHLIGHTED);
}

export function setFeatureLabel(
  feature: Feature<Geometry>,
  label: string
): void {
  feature.set(LABEL, label);
}

export function getFeatureLabel(feature: Feature<Geometry>): string {
  return feature.get(LABEL);
}

export function setFeatureName(feature: Feature<Geometry>, name: string): void {
  feature.set(NAME, name);
}

export function getFeatureName(feature: Feature<Geometry>): string {
  return feature.get(NAME);
}

export function setRecord(feature: Feature<Geometry>, record: any): void {
  feature.set(RECORD, record);
}

export function getRecord(feature: Feature<Geometry>): any {
  return feature.get(RECORD);
}

export function setFeatures(
  feature: Feature<Geometry>,
  features: Array<Feature<Geometry>>
): void {
  feature.set(FEATURES, features);
}

export function getFeatures(
  feature: Feature<Geometry>
): Array<Feature<Geometry>> {
  return feature.get(FEATURES);
}

export function setUnitId(
  feature: Feature<Geometry>,
  unitId: string | number
): void {
  feature.set(UNITID, unitId);
}

export function getUnitId(feature: Feature<Geometry>): string | number {
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
