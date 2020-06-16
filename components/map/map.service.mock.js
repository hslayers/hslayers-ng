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
}
