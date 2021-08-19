import Map from 'ol/Map';
import {Layer} from 'ol/layer';
import {Source} from 'ol/source';

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

  addLayer(layer): Layer<Source> {
    try {
      this.map.addLayer(layer);
      return layer;
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
