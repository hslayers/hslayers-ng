import {Cluster, Vector as VectorSource} from 'ol/source';
import {HsUtilsServiceMock} from './utils.service.mock';
import {Layer, Vector as VectorLayer} from 'ol/layer';

export class HsLayerUtilsServiceMock {
  constructor() {}

  HsUtilsService = new HsUtilsServiceMock();
  isLayerVectorLayer(layer: Layer<Source>): boolean {
    if (
      this.HsUtilsService.instOf(layer, VectorLayer) &&
      (this.HsUtilsService.instOf(layer.getSource(), Cluster) ||
        this.HsUtilsService.instOf(layer.getSource(), VectorSource))
    ) {
      return true;
    }
    return false;
  }

  getLayerTitle(layer: Layer<Source>): string {
    return 'test';
  }

  getURL(layer: Layer<Source>): string {
    return 'http://dummy-layer-url';
  }

  isLayerWMS(layer: Layer<Source>): boolean {
    return false;
  }

  isLayerWMTS(layer: Layer<Source>): boolean {
    return false;
  }

  isLayerGeoJSONSource(layer: Layer<Source>): boolean {
    return false;
  }

  isLayerKMLSource(layer: Layer<Source>): boolean {
    return false;
  }

  isLayerTopoJSONSource(layer: Layer<Source>): boolean {
    return false;
  }

  isLayerXYZ(layer: Layer<Source>): boolean {
    return false;
  }
}
