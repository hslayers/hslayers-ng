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
        population: Math.random() * 5000000,
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
          sld: `<?xml version="1.0" encoding="ISO-8859-1"?>
          <StyledLayerDescriptor version="1.0.0" 
              xsi:schemaLocation="http://www.opengis.net/sld StyledLayerDescriptor.xsd" 
              xmlns="http://www.opengis.net/sld" 
              xmlns:ogc="http://www.opengis.net/ogc" 
              xmlns:xlink="http://www.w3.org/1999/xlink" 
              xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
            <NamedLayer>
              <Name>Simple point with stroke</Name>
              <UserStyle>
                <Title>GeoServer SLD Cook Book: Simple point with stroke</Title>
                <FeatureTypeStyle>
                  <Rule>
                    <PointSymbolizer>
                      <Graphic>
                        <Mark>
                          <WellKnownName>circle</WellKnownName>
                          <Fill>
                            <CssParameter name="fill">#FF0000</CssParameter>
                          </Fill>
                          <Stroke>
                            <CssParameter name="stroke">#000000</CssParameter>
                            <CssParameter name="stroke-width">2</CssParameter>
                          </Stroke>
                        </Mark>
                        <Size>6</Size>
                      </Graphic>
                    </PointSymbolizer>
                  </Rule>
                </FeatureTypeStyle>
              </UserStyle>
            </NamedLayer>
          </StyledLayerDescriptor>
          `,
          path: 'User generated',
          source: new VectorSource({features}),
        }),
      ],
    });
  }
  title = 'hslayers-workspace';
}
