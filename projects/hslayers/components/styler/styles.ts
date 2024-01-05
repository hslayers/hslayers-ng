import {Circle, Fill, Stroke, Style} from 'ol/style';

export const simple_style = new Style({
  fill: new Fill({
    color: 'rgba(255, 255, 255, 1)',
  }),
  stroke: new Stroke({
    color: '#ffcc33',
    width: 1,
  }),
  image: new Circle({
    radius: 7,
    fill: new Fill({
      color: '#ffcc33',
    }),
  }),
});
