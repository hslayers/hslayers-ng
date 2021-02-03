import Feature from 'ol/Feature';

const TITLE = 'title';
const HIGHLIGHTED = 'highlighted';
const LABEL = 'label';
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
export const HsFeatureExt = {
  setFeatureTitle,
  getFeatureTitle,
  setHighlighted,
  getHighlighted,
  setFeatureLabel,
  getFeatureLabel,
};
