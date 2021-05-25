import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import {Component} from '@angular/core';
import {Image as ImageLayer, Vector as VectorLayer} from 'ol/layer';
import {OSM, Vector as VectorSource} from 'ol/source';
import {Tile} from 'ol/layer';

import {HsConfig} from '../../../hslayers/src/config.service';

@Component({
  selector: 'hslayers-app',
  templateUrl: './hslayers-app.component.html',
  styleUrls: [],
})
export class HslayersAppComponent {
  constructor(public HsConfig: HsConfig) {
    const count = 200;
    const features = new Array(count);
    const e = 4500000;
    for (let i = 0; i < count; ++i) {
      const coordinates = [
        2 * e * Math.random() - e,
        2 * e * Math.random() - e,
      ];
      features[i] = new Feature({
        geometry: new Point(coordinates),
        name: 'test',
      });
    }
    Object.assign(this.HsConfig, {
      default_layers: [
        new Tile({
          source: new OSM(),
          title: 'OpenStreetMap',
          base: true,
          visible: true,
          removable: false,
        }),
        new VectorLayer({
          title: 'Bookmarks',
          synchronize: false,
          cluster: true,
          inlineLegend: true,
          popUp: {
            attributes: ['name'],
          },
          editor: {
            editable: true,
            defaultAttributes: {
              name: 'New bookmark',
              description: 'none',
            },
          },
          path: 'User generated',
          source: new VectorSource({features}),
        }),
      ],
    });
  }
  title = 'hslayers-workspace';
}
