import {Layer} from 'ol/layer';

export class HsLayerUtilsServiceMock {
  constructor() {}

  isLayerVectorLayer(layer: Layer): boolean {
    return false;
  }

  getLayerTitle(layer: Layer): string {
    return 'test';
  }

  getURL(layer: Layer): string {
    return 'http://dummy-layer-url';
  }

  isLayerWMS(layer: Layer): boolean {
    return false;
  }

  isLayerWMTS(layer: Layer): boolean {
    return false;
  }

  isLayerGeoJSONSource(layer: Layer): boolean {
    return false;
  }

  isLayerKMLSource(layer: Layer): boolean {
    return false;
  }

  isLayerTopoJSONSource(layer: Layer): boolean {
    return false;
  }

  isLayerXYZ(layer: Layer): boolean {
    return false;
  }
}
