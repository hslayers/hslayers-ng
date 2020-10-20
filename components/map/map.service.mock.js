import Map from 'ol/Map';

export class HsMapServiceMock {
  constructor() {
    this.map = new Map({
      target: 'div',
      interactions: [],
    });
  }

  loaded() {
    return new Promise((resolve, reject) => {
      resolve(this.map);
    });
  }

  getMapExtentInEpsg4326() {
    return [0, 0, 100, 100];
  }

  addLayer(layer) {
    this.map.addLayer(layer);
  }

  getMapExtent() {
    return [0, 0, 100, 100];
  }
}
