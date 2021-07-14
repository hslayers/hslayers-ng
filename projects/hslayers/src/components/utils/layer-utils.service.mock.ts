import {Cluster, Vector as VectorSource} from 'ol/source';
import {HsUtilsServiceMock} from './utils.service.mock';
import {Layer, Vector as VectorLayer} from 'ol/layer';

export class HsLayerUtilsServiceMock {
  constructor() {}

  HsUtilsService = new HsUtilsServiceMock();
  isLayerVectorLayer(layer: Layer): boolean {
    if (
      this.HsUtilsService.instOf(layer, VectorLayer) &&
      (this.HsUtilsService.instOf(layer.getSource(), Cluster) ||
        this.HsUtilsService.instOf(layer.getSource(), VectorSource))
    ) {
      return true;
    }
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
