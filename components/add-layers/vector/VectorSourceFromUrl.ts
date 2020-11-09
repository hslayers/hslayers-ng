import * as loadingStrategy from 'ol/loadingstrategy';
import VectorSource from 'ol/source/Vector';
import {get as getProj} from 'ol/proj';

import {VectorLayerDescriptor} from './VectorLayerDescriptor';

export class VectorSourceFromUrl extends VectorSource {
  featureProjection: any;
  mapProjection: any;
  hasPoint: boolean;
  hasPoly: boolean;
  hasLine: boolean;
  styleAble: boolean;
  error: boolean;
  errorMessage: any;
  constructor(descriptor: VectorLayerDescriptor) {
    super({
      format: descriptor.sourceParams.format,
      url: descriptor.sourceParams.url,
      extractStyles: descriptor.sourceParams.extractStyles,
      strategy: loadingStrategy.all,
    });
    this.featureProjection = getProj(descriptor.sourceParams.srs);
    this.mapProjection = descriptor.mapProjection;
    super.setLoader(this.loaderFunction);
  }

  async loaderFunction(extent, resolution, projection): Promise<void> {
    try {
      super.set('loaded', false);
      const response = await fetch(super.getUrl());

      let data: any = await response.text();
      if (data.type == 'GeometryCollection') {
        const temp = {
          type: 'Feature',
          geometry: data,
        };
        data = temp;
      }
      super.addFeatures(
        super.getFormat().readFeatures(data, {
          dataProjection: this.featureProjection,
          featureProjection: this.mapProjection,
        })
      );

      //TODO: probably we should not do this. Have to check when styler is operational
      this.hasLine = false;
      this.hasPoly = false;
      this.hasPoint = false;
      for (const f of super.getFeatures()) {
        if (f.getGeometry()) {
          switch (f.getGeometry().getType()) {
            case 'LineString' || 'MultiLineString':
              this.hasLine = true;
              break;
            case 'Polygon' || 'MultiPolygon':
              this.hasPoly = true;
              break;
            case 'Point' || 'MultiPoint':
              this.hasPoint = true;
              break;
            default:
          }
        }
      }

      if (this.hasLine || this.hasPoly || this.hasPoint) {
        this.styleAble = true;
      }
      super.set('loaded', true);
    } catch (err) {
      this.error = true;
      this.errorMessage = err.status;
      super.set('loaded', true);
    }
  }
}
