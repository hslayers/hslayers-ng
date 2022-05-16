import Map from 'ol/Map';
import {Layer} from 'ol/layer';
import {Source} from 'ol/source';

export class HsMapServiceMock {
  apps: {
    [id: string]: {map: Map};
  } = {
    default: {
      map: new Map({
        target: 'div',
        interactions: [],
      }),
    },
  };

  constructor() {}

  loaded(app: string) {
    return new Promise((resolve, reject) => {
      resolve(this.getMap(app));
    });
  }

  getMap(app: string) {
    return this.apps[app ?? 'default'].map;
  }

  getMapExtentInEpsg4326() {
    return [0, 0, 100, 100];
  }

  addLayer(layer, app: string): Layer<Source> {
    try {
      this.getMap(app).addLayer(layer);
      return layer;
    } catch (ex) {
      //
    }
  }

  getCurrentProj(app: string) {
    return this.getMap(app).getView().getProjection();
  }

  getMapExtent() {
    return [0, 0, 100, 100];
  }

  getLayersArray() {
    return [];
  }

  removeCompositionLayers() {
    return true;
  }
}
