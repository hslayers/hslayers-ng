import VectorSource from 'ol/source/Vector';

export class VectorSourceFromFeatures extends VectorSource {
  constructor(params) {
    super({
      projection: params.sourceParams.srs,
      features: params.sourceParams.features,
    });

    this.hasLine = false;
    this.hasPoly = false;
    this.hasPoint = false;
    this.getFeatures().forEach((f) => {
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
    });

    if (this.hasLine || this.hasPoly || this.hasPoint) {
      this.styleAble = true;
    }
  }
}
