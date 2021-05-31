import * as loadingStrategy from 'ol/loadingstrategy';
import VectorSource from 'ol/source/Vector';
import {get as getProj} from 'ol/proj';

export class VectorSourceFromUrl extends VectorSource {
  featureProjection: any;
  mapProjection: any;
  error: boolean;
  errorMessage: any;
  constructor(descriptor: any) {
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

      super.set('loaded', true);
    } catch (err) {
      this.error = true;
      this.errorMessage = err.status;
      super.set('loaded', true);
    }
  }
}
