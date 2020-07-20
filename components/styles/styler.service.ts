import {Circle, Fill, Icon, Stroke, Style} from 'ol/style';
import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class HsStylerService {
  layer: any = null;
  measure_style = new Style({
    fill: new Fill({
      color: 'rgba(255, 255, 255, 1)',
    }),
    stroke: new Stroke({
      color: '#ffcc33',
      width: 2,
    }),
    image: new Circle({
      radius: 7,
      fill: new Fill({
        color: '#ffcc33',
      }),
    }),
  });

  simple_style = new Style({
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

  pin_white_blue = new Style({
    image: new Icon({
      src: '../../img/pin_white_blue32.png',
      crossOrigin: 'anonymous',
      anchor: [0.5, 1],
    }),
  });
  constructor() {}

  pin_white_blue_highlight(feature, resolution) {
    return [
      new Style({
        image: new Icon({
          src: feature.get('highlighted')
            ? '../../img/pin_white_red32.png'
            : '../../img/pin_white_blue32.png',
          crossOrigin: 'anonymous',
          anchor: [0.5, 1],
        }),
      }),
    ];
  }
}