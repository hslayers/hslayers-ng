import Layer from 'ol/layer/Layer';

const TITLE = 'title';
const NAME = 'name';

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

export const HsLayerExt = {
  setTitle,
  getTitle,
  setName,
  getName,
};
