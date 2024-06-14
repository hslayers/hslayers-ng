import {Component} from '@angular/core';

import {Feature} from 'ol';
import {GeoJSON} from 'ol/format';
import {OSM, Vector as VectorSource, XYZ} from 'ol/source';
import {Point} from 'ol/geom';
import {Tile} from 'ol/layer';
import {Vector as VectorLayer} from 'ol/layer';

import {HsConfig} from 'hslayers-ng/config';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsLayoutService} from 'hslayers-ng/services/layout';
/**
 * Dynamic panels
 */
//import {HsPanelConstructorService} from 'hslayers-ng/services/panel-constructor';
/**
 * Dynamic overlays
 */
//import {HsOverlayConstructorService} from 'hslayers-ng/services/panel-constructor';
import {HsLayerManagerComponent} from 'hslayers-ng/components/layer-manager';
import {HsPanelContainerService} from 'hslayers-ng/services/panels';
import {HsSidebarService} from 'hslayers-ng/services/sidebar';

@Component({
  selector: 'hslayers-app',
  templateUrl: './hslayers-app.component.html',
  styleUrls: [],
})
export class HslayersAppComponent {
  constructor(
    public HsConfig: HsConfig,
    private HsEventBusService: HsEventBusService,
    private hsSidebarService: HsSidebarService,
    //private HslayersService: HslayersService,
    hsLayoutService: HsLayoutService,
    //HsOverlayConstructorService: HsOverlayConstructorService,
    // private hsPanelConstructorService: HsPanelConstructorService,
    private HsPanelContainerService: HsPanelContainerService,
  ) {
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
        population: Math.round(Math.random() * 5000000),
      });
    }
    const polygonSld = `<?xml version="1.0" encoding="ISO-8859-1"?>
    <StyledLayerDescriptor version="1.0.0" 
        xsi:schemaLocation="http://www.opengis.net/sld StyledLayerDescriptor.xsd" 
        xmlns="http://www.opengis.net/sld" 
        xmlns:ogc="http://www.opengis.net/ogc" 
        xmlns:xlink="http://www.w3.org/1999/xlink" 
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
      <NamedLayer>
        <Name>Simple point with stroke</Name>
        <UserStyle>
          <Title>Default</Title>
          <FeatureTypeStyle>
            <Rule>
            <PolygonSymbolizer>
            <Fill>
              <CssParameter name="fill">#000080</CssParameter>
            </Fill>
          </PolygonSymbolizer>
            </Rule>
          </FeatureTypeStyle>
        </UserStyle>
      </NamedLayer>
    </StyledLayerDescriptor>
    `;
    const geojsonObject = {
      'type': 'FeatureCollection',
      'crs': {
        'type': 'name',
        'properties': {
          'name': 'EPSG:3857',
        },
      },
      'features': [
        {
          'type': 'Feature',
          'geometry': {
            'type': 'Polygon',
            'coordinates': [
              [
                [-5e6, 6e6],
                [-5e6, 8e6],
                [-3e6, 8e6],
                [-3e6, 6e6],
                [-5e6, 6e6],
              ],
            ],
          },
        },
        {
          'type': 'Feature',
          'geometry': {
            'type': 'Polygon',
            'coordinates': [
              [
                [-2e6, 6e6],
                [-2e6, 8e6],
                [0, 8e6],
                [0, 6e6],
                [-2e6, 6e6],
              ],
            ],
          },
        },
        {
          'type': 'Feature',
          'geometry': {
            'type': 'Polygon',
            'coordinates': [
              [
                [1e6, 6e6],
                [1e6, 8e6],
                [3e6, 8e6],
                [3e6, 6e6],
                [1e6, 6e6],
              ],
            ],
          },
        },
        {
          'type': 'Feature',
          'geometry': {
            'type': 'Polygon',
            'coordinates': [
              [
                [-2e6, -1e6],
                [-1e6, 1e6],
                [0, -1e6],
                [-2e6, -1e6],
              ],
            ],
          },
        },
      ],
    };
    const opticalMap = new Tile({
      source: new XYZ({
        attributions:
          '&copy; <a href="http://www.baltsat.lv/">Baltic Satellite Service</a>, <a href="https://www.esa.int/">European Space Agency - ESA</a>',
        url: 'https://wms.forestradar.com/tiles-v1/fie-xNFwHfJdIR1dCtA7kJ1K8g/{time}-RGB/{z}/{x}/{y}.png',
        crossOrigin: 'Anonymous',
      }),
      properties: {
        title: 'Optical satellite basemap',
        from_composition: true,
        dimensions: {
          time: {
            value: '2020-11-20',
            name: 'time',
            values: ['2020-11-20'],
          },
        },
        base: false,
        editor: {editable: false},
        path: 'Vegetation indexes and satellite imagery',
      },
      maxZoom: 18,
      visible: false,
      opacity: 1,
    });
    this.HsConfig.update({
      datasources: [
        {
          title: 'Layman',
          url: 'http://localhost:8087',
          type: 'layman',
        },
      ],
      proxyPrefix: window.location.hostname.includes('localhost')
        ? `${window.location.protocol}//${window.location.hostname}:8085/`
        : '/proxy/',
      panelsEnabled: {
        tripPlanner: false,
        addData: false,
        mapSwipe: false,
      },
      componentsEnabled: {
        geolocationButton: true,
        guiOverlay: true,
      },
      assetsPath: '/assets',
      symbolizerIcons: [
        {name: 'bag', url: '/assets/icons/bag1.svg'},
        {name: 'banking', url: '/assets/icons/banking4.svg'},
        {name: 'bar', url: '/assets/icons/bar.svg'},
        {name: 'beach', url: '/assets/icons/beach17.svg'},
        {name: 'bicycles', url: '/assets/icons/bicycles.svg'},
        {name: 'building', url: '/assets/icons/building103.svg'},
        {name: 'bus', url: '/assets/icons/bus4.svg'},
        {name: 'cabinet', url: '/assets/icons/cabinet9.svg'},
        {name: 'camping', url: '/assets/icons/camping13.svg'},
        {name: 'caravan', url: '/assets/icons/caravan.svg'},
        {name: 'church', url: '/assets/icons/church1.svg'},
        {name: 'church', url: '/assets/icons/church15.svg'},
        {name: 'coffee-shop', url: '/assets/icons/coffee-shop1.svg'},
        {name: 'disabled', url: '/assets/icons/disabled.svg'},
        {name: 'favourite', url: '/assets/icons/favourite28.svg'},
        {name: 'football', url: '/assets/icons/football1.svg'},
        {name: 'footprint', url: '/assets/icons/footprint.svg'},
        {name: 'gift-shop', url: '/assets/icons/gift-shop.svg'},
        {name: 'gps', url: '/assets/icons/gps5.svg'},
        {name: 'gps', url: '/assets/icons/gps40.svg'},
        {name: 'gps', url: '/assets/icons/gps41.svg'},
        {name: 'gps', url: '/assets/icons/gps42.svg'},
        {name: 'gps', url: '/assets/icons/gps43.svg'},
        {name: 'hospital', url: '/assets/icons/hospital.svg'},
        {name: 'hot-air-balloon', url: '/assets/icons/hot-air-balloon2.svg'},
        {name: 'information', url: '/assets/icons/information78.svg'},
        {name: 'library', url: '/assets/icons/library21.svg'},
        {name: 'location', url: '/assets/icons/location6.svg'},
        {name: 'luggage', url: '/assets/icons/luggage13.svg'},
        {name: 'monument', url: '/assets/icons/monument1.svg'},
        {name: 'mountain', url: '/assets/icons/mountain42.svg'},
        {name: 'museum', url: '/assets/icons/museum35.svg'},
        {name: 'park', url: '/assets/icons/park11.svg'},
        {name: 'parking', url: '/assets/icons/parking28.svg'},
        {name: 'pharmacy', url: '/assets/icons/pharmacy17.svg'},
        {name: 'port', url: '/assets/icons/port2.svg'},
        {name: 'restaurant', url: '/assets/icons/restaurant52.svg'},
        {name: 'road-sign', url: '/assets/icons/road-sign1.svg'},
        {name: 'sailing-boat', url: '/assets/icons/sailing-boat2.svg'},
        {name: 'ski', url: '/assets/icons/ski1.svg'},
        {name: 'swimming', url: '/assets/icons/swimming26.svg'},
        {name: 'telephone', url: '/assets/icons/telephone119.svg'},
        {name: 'toilets', url: '/assets/icons/toilets2.svg'},
        {name: 'train-station', url: '/assets/icons/train-station.svg'},
        {name: 'university', url: '/assets/icons/university2.svg'},
        {name: 'warning', url: '/assets/icons/warning.svg'},
        {name: 'wifi', url: '/assets/icons/wifi8.svg'},
      ],
      popUpDisplay: 'hover',
      default_layers: [
        new Tile({
          source: new OSM(),
          visible: true,
          properties: {
            title: 'OpenStreetMap',
            base: true,
            removable: false,
          },
        }),
        new VectorLayer({
          properties: {
            title: 'Points',
            synchronize: false,
            cluster: false,
            inlineLegend: true,
            popUp: {
              attributes: ['name', 'population'],
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
                  <Title>Default</Title>
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
          },
          source: new VectorSource({features}),
        }),
        new VectorLayer({
          visible: true,
          properties: {
            title: 'Polygons',
            synchronize: false,
            cluster: false,
            inlineLegend: true,
            popUp: {
              attributes: ['name'],
              widgets: ['layer-name', 'clear-layer'],
            },
            editor: {
              editable: true,
              defaultAttributes: {
                name: 'New polygon',
                description: 'none',
              },
            },
            sld: polygonSld,
            path: 'User generated',
          },
          source: new VectorSource({
            features: new GeoJSON().readFeatures(geojsonObject),
          }),
        }),
        opticalMap,
      ],
    });
    const dimensions = opticalMap.get('dimensions');
    if (dimensions) {
      opticalMap.get('dimensions').time.values = [
        '2019-02-17',
        '2019-02-22',
        '2019-04-03',
        '2019-04-05',
        '2019-04-18',
      ];
    }
    //Simulating ajax
    setTimeout(() => {
      this.HsEventBusService.layerDimensionDefinitionChanges.next(opticalMap);
    }, 100);

    /***
     * EASILY CREATE COMPONENTS + MAKE CHUNKS FOR ALL COMPONENTS
     * WHICH WOULD BE DOWNLOADED BY BROWSER BASED ON
     * PANELS ENABLED
     */
    //this.hsPanelConstructorService.createActivePanels();

    /**
     * SAME FOR GUI OVERALAY - based on componentsEnabled
     *  - toolbars
     *  - popup
     *  - mapGallery, geolocation etc.
     */
    // HsOverlayConstructorService.createGuiOverlay();

    /***
     * CREATE COMPONENT INDIVIDUALY - omitting services with dynamic imports (constructors)
     * so that no lazy chunks are part of the build, only treeshaken parts included in main
     */
    this.HsPanelContainerService.create(HsLayerManagerComponent, {});
    this.hsSidebarService.addButton(
      this.hsSidebarService.buttonDefinition['layerManager'],
    );
  }
  title = 'hslayers-workspace';
}
