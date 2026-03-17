import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import {fromLonLat} from 'ol/proj';

export class MockHsLayerSelectorService {
  currentLayer: {layer: VectorLayer<VectorSource>} = {layer: undefined};

  constructor() {
    // Create a feature with two attributes
    const feature = new Feature({
      geometry: new Point(fromLonLat([0, 0])), // Example coordinates
      stringBased: 'value1',
      numeric: 123,
    });

    // Create a vector source and add the feature to it
    const source = new VectorSource({
      features: [feature],
    });

    // Create a vector layer and set its source
    this.currentLayer.layer = new VectorLayer({
      source: source,
    });
  }

  getCurrentLayer() {
    return this.currentLayer;
  }
}
