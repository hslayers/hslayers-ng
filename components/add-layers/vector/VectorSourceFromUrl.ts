import * as loadingStrategy from 'ol/loadingstrategy';
import VectorSource from 'ol/source/Vector';
import {get as getProj} from 'ol/proj';

export class VectorSourceFromUrl extends VectorSource {
  constructor(descriptor) {
    super({
      format: descriptor.sourceParams.format,
      url: descriptor.sourceParams.url,
      extractStyles: descriptor.sourceParams.extractStyles,
      strategy: loadingStrategy.all,
    });
    this.featureProjection = getProj(descriptor.sourceParams.srs);
    this.mapProjection = descriptor.mapProjection;
    this.setLoader(this.loaderFunction);
  }

  async loaderFunction(extent, resolution, projection) {
    const me = this;
    try {
      me.set('loaded', false);
      const response = await fetch(me.getUrl());

      let data = await response.text();
      if (data.type == 'GeometryCollection') {
        const temp = {
          type: 'Feature',
          geometry: data,
        };
        data = temp;
      }
      me.addFeatures(
        me.getFormat().readFeatures(data, {
          dataProjection: me.featureProjection,
          featureProjection: me.mapProjection,
        })
      );

      //TODO probably we should not do this. Have to check when styler is operational
      me.hasLine = false;
      me.hasPoly = false;
      me.hasPoint = false;
      angular.forEach(me.getFeatures(), (f) => {
        if (f.getGeometry()) {
          switch (f.getGeometry().getType()) {
            case 'LineString' || 'MultiLineString':
              me.hasLine = true;
              break;
            case 'Polygon' || 'MultiPolygon':
              me.hasPoly = true;
              break;
            case 'Point' || 'MultiPoint':
              me.hasPoint = true;
              break;
            default:
          }
        }
      });

      if (me.hasLine || me.hasPoly || me.hasPoint) {
        me.styleAble = true;
      }
      me.set('loaded', true);
    } catch (err) {
      me.error = true;
      me.errorMessage = err.status;
      me.set('loaded', true);
    }
  }
}
