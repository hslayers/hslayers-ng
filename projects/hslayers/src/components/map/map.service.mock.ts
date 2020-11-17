import Map from 'ol/Map';
import {Layer} from 'ol/layer';

export class HsMapServiceMock {
  map = new Map({
    target: 'div',
    interactions: [],
  });
  constructor() {}

  loaded() {
    return new Promise((resolve, reject) => {
      resolve(this.map);
    });
  }

  getMapExtentInEpsg4326() {
    return [0, 0, 100, 100];
  }

  addLayer(layer): Layer {
    this.map.addLayer(layer);
  }

  getMapExtent() {
    return [0, 0, 100, 100];
  }
}
