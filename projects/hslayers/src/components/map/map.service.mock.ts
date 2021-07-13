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
    try {
      this.map.addLayer(layer);
    } catch (ex) {
      //
    }
  }

  getCurrentProj() {
    return this.map.getView().getProjection();
  }

  getMapExtent() {
    return [0, 0, 100, 100];
  }

  getLayersArray() {
    return [];
  }
}
