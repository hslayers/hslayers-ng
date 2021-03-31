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
    return 'http://test.test';
  }

  isLayerWMS(layer: Layer): boolean {
    return false;
  }

  isLayerWMTS(layer: Layer): boolean {
    return false;
  }
}
