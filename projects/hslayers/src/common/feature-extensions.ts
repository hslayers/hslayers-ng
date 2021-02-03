import Feature from 'ol/Feature';

const TITLE = 'title';
const HIGHLIGHTED = 'highlighted';
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
export const HsFeatureExt = {
  setFeatureTitle,
  getFeatureTitle,
  setHighlighted,
  getHighlighted,
};
