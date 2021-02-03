import Feature from 'ol/Feature';

const TITLE = 'title';

export function setFeatureTitle(feature: Feature, title: string): void {
  feature.set(TITLE, title);
}

export function getFeatureTitle(feature: Feature): string {
  return feature.get(TITLE);
}

export const HsFeatureExt = {
  setFeatureTitle,
  getFeatureTitle,
};
