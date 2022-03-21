import {Component} from '@angular/core';
import {HttpClient} from '@angular/common/http';

import Feature from 'ol/Feature';
import GeoJSON from 'ol/format/GeoJSON';
import IDW from 'ol-ext/source/IDW';
import Point from 'ol/geom/Point';
import {Circle, Fill, Stroke, Style, Text} from 'ol/style';
import {Image as ImageLayer, Tile} from 'ol/layer';
import {OSM, TileWMS, Vector as VectorSource, XYZ} from 'ol/source';
import {Vector as VectorLayer} from 'ol/layer';
import {bbox} from 'ol/loadingstrategy';
import {catchError} from 'rxjs';

import {HsConfig} from 'hslayers-ng/src/config.service';
import {HsEventBusService} from 'hslayers-ng/src/components/core/event-bus.service';
import {HsLanguageService} from 'hslayers-ng/src/components/language/language.service';
import {HsQueryPopupWidgetContainerService} from 'hslayers-ng/src/components/query/query-popup-widget-container.service';
import {HsToastService} from 'hslayers-ng/src/components/layout/toast/toast.service';
import {HsUtilsService} from 'hslayers-ng/src/components/utils/utils.service';
import {PopupWidgetComponent} from './popup-widget.component';
import {extentTo4326} from 'hslayers-ng/src/common/extent-utils';
import {normalizeWeight} from 'hslayers-ng/src/common/idw-weight-normalize-utils';

@Component({
  selector: 'hslayers-app',
  templateUrl: './hslayers-app.component.html',
  styleUrls: [],
})
export class HslayersAppComponent {
  constructor(
    public HsConfig: HsConfig,
    private hsUtilsService: HsUtilsService,
    private hsToastService: HsToastService,
    private hsLanguageService: HsLanguageService,
    private httpClient: HttpClient,
    private HsEventBusService: HsEventBusService,
    private HsQueryPopupWidgetContainerService: HsQueryPopupWidgetContainerService
  ) {
    const apps = [
      {
        name: 'default',
        panelsEnabled: {
          compositionLoadingProgress: true,
          draw: true,
          tripPlanner: true,
          mapSwipe: true,
        },
        sidebarPosition: 'right',
      },
      {
        name: 'app-2',
        panelsEnabled: {
          compositionLoadingProgress: true,
          tripPlanner: true,
          mapSwipe: false,
        },
        sidebarPosition: 'left',
      },
    ];
    for (const app of apps) {
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
          val: this.getRandomInt(0, 100),
        });
      }
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
            'properties': {
              'name': 'Poly 3',
              'id': 'poly1',
              'population': Math.floor(Math.random() * 100000),
            },
            'id': 'poly1',
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
            'properties': {
              'name': 'Poly 2',
              'id': 'poly2',
              'population': Math.floor(Math.random() * 100000),
            },
            'id': 'poly2',
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
            'properties': {
              'name': 'Poly 4',
              'population': Math.floor(Math.random() * 100000),
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
            'properties': {
              'name': 'Poly 1',
              'population': Math.floor(Math.random() * 100000),
            },
          },
        ],
      };
      const points = new VectorLayer({
        properties: {
          title: 'Points',
          synchronize: false,
          swipeSide: 'left',
          cluster: false,
          inlineLegend: true,
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
      });
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
      const polygons = new VectorLayer({
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
      });
      const weight = 'dwn2020';
      const idwVectorSource = new VectorSource({
        loader: async (extent, resolution, projection, success, failure) => {
          this.hsToastService.createToastPopupMessage(
            await this.hsLanguageService.awaitTranslation(
              'IDW layer request',
              undefined,
              app.name
            ),
            'Loading IDW layer source, please wait!',
            {
              disableLocalization: true,
              toastStyleClasses: 'bg-warning text-light',
              serviceCalledFrom: 'HsIDWLayerService',
              customDelay: 60000,
            },
            app.name
          );
          const parsedExtent = extentTo4326(extent, projection);
          const url =
            'https://api-agroclimatic.lesprojekt.cz/area/year/preci/0/48.0/52.0/12.0/16.0/0.1/0.1/1.0/2020/2020/ERA5-Land';
          // const url = `https://api-agroclimatic.lesprojekt.cz/area/year/preci/0/${parsedExtent[0]}/${parsedExtent[1]}/${parsedExtent[2]}/${parsedExtent[3]}/0.1/0.1/1.0/2020/2020/ERA5-Land`;
          this.httpClient
            .get(this.hsUtilsService.proxify(url, app.name))
            .pipe(
              catchError(async (e) => {
                this.hsToastService.removeByText(
                  this.hsLanguageService.getTranslation(
                    'Loading IDW layer source, please wait!',
                    undefined,
                    app.name
                  ),
                  app.name
                );
                this.hsToastService.createToastPopupMessage(
                  await this.hsLanguageService.awaitTranslation(
                    'IDW layer request',
                    undefined,
                    app.name
                  ),
                  'Failed to load IDW source',
                  {
                    disableLocalization: true,
                  },
                  app.name
                );
              })
            )
            .subscribe(async (response: any) => {
              this.hsToastService.removeByText(
                this.hsLanguageService.getTranslation(
                  'Loading IDW layer source, please wait!',
                  undefined,
                  app.name
                ),
                app.name
              );
              if (response?.features?.length > 0) {
                this.hsToastService.createToastPopupMessage(
                  await this.hsLanguageService.awaitTranslation(
                    'IDW layer request',
                    undefined,
                    app.name
                  ),
                  'IDW source loaded',
                  {
                    disableLocalization: true,
                    toastStyleClasses: 'bg-success text-light',
                    serviceCalledFrom: 'HsIDWLayerService',
                  },
                  app.name
                );
                response.features = new GeoJSON().readFeatures(response, {
                  dataProjection: 'EPSG:4326',
                  featureProjection: projection,
                });
                normalizeWeight(response.features, weight);
                idwVectorSource.clear();
                idwVectorSource.addFeatures(features);
              }
            });
        },
        strategy: bbox,
      });

      const IdwVector = new VectorLayer({
        properties: {
          title: 'IDW vector layer',
        },
        source: idwVectorSource,
        style: function (feature, resolution) {
          return [
            new Style({
              text: new Text({
                text: feature?.get(weight)?.toString(),
                font: '12px Calibri,sans-serif',
                overflow: true,
                fill: new Fill({
                  color: '#000',
                }),
                stroke: new Stroke({
                  color: '#fff',
                  width: 3,
                }),
              }),
            }),
          ];
        },
      });

      const idwLayerSource = new IDW({
        source: idwVectorSource,
        weight,
      });

      const idwLayer = new ImageLayer({
        properties: {title: 'IDW layer'},
        source: idwLayerSource,
        opacity: 0.5,
      });

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
          swipeSide: 'right',
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
      this.HsConfig.update(
        {
          sidebarPosition: app.sidebarPosition,
          queryPopupWidgets: ['layer-name', 'feature-info', 'clear-layer'],
          datasources: [
            {
              title: 'Layman',
              url: 'http://localhost:8087',
              user: 'anonymous',
              type: 'layman',
              liferayProtocol: 'https',
            },
            {
              title: 'Micka',
              url: 'https://hub.sieusoil.eu/cat/csw',
              language: 'eng',
              type: 'micka',
            },
          ],
          proxyPrefix: window.location.hostname.includes('localhost')
            ? `${window.location.protocol}//${window.location.hostname}:8085/`
            : '/proxy/',
          panelsEnabled: app.panelsEnabled,
          mapSwipeOptions: {
            orientation: 'vertical',
          },
          componentsEnabled: {
            basemapGallery: true,
            mapSwipe: true,
          },
          enabledLanguages: 'sk, lv, en',
          language: 'en',
          assetsPath: 'assets',
          saveMapStateOnReload: true,
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
            {
              name: 'hot-air-balloon',
              url: '/assets/icons/hot-air-balloon2.svg',
            },
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
          status_manager_url: 'http://localhost:8086',
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
                title: 'Clusters without SLD',
                synchronize: false,
                cluster: true,
                inlineLegend: true,
                popUp: {
                  attributes: ['name', 'population'],
                },
                editor: {editable: false},
                path: 'User generated',
              },
              style: new Style({
                image: new Circle({
                  fill: new Fill({
                    color: 'rgba(0, 157, 87, 0.5)',
                  }),
                  stroke: new Stroke({
                    color: 'rgb(0, 157, 87)',
                    width: 2,
                  }),
                  radius: 5,
                }),
              }),
              source: new VectorSource({features}),
            }),
            new VectorLayer({
              properties: {
                title: 'Polygons',
                synchronize: false,
                cluster: false,
                inlineLegend: true,
                popUp: {
                  attributes: ['name'],
                  widgets: ['layer-name', 'clear-layer'],
                },
                domFeatureLinks: [
                  {
                    domSelector: '#poly1',
                    feature: 'poly1',
                    event: 'mouseover',
                    actions: ['zoomToExtent'],
                  },
                  {
                    domSelector: '#poly2',
                    feature: 'poly2',
                    event: 'mouseover',
                    actions: ['showPopup'],
                  },
                ],
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
            new VectorLayer({
              properties: {
                title: 'Polygons with display f-n',
                synchronize: false,
                cluster: false,
                inlineLegend: true,
                popUp: {
                  attributes: ['name'],
                  widgets: ['layer-name', 'clear-layer'], //Will be ignored due to display function
                  displayFunction: function (feature) {
                    return `<a>${feature.get(
                      'name'
                    )} with population of ${feature.get('population')}</a>`;
                  },
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
            polygons,
            points,
            new Tile({
              properties: {
                title: 'Latvian municipalities (parent layer)',
              },
              source: new TileWMS({
                url: 'https://lvmgeoserver.lvm.lv/geoserver/ows',
                params: {
                  LAYERS: 'publicwfs:LV_admin_vienibas',
                  INFO_FORMAT: undefined,
                  FORMAT: 'image/png; mode=8bit',
                },
                crossOrigin: 'anonymous',
              }),
            }),
            new Tile({
              properties: {
                title: 'Latvian municipalities (1 sub-layer)',
                sublayers: 'publicwfs:arisparish',
              },
              source: new TileWMS({
                url: 'https://lvmgeoserver.lvm.lv/geoserver/ows',
                params: {
                  LAYERS: 'publicwfs:LV_admin_vienibas',
                  INFO_FORMAT: undefined,
                  FORMAT: 'image/png; mode=8bit',
                },
                crossOrigin: 'anonymous',
              }),
            }),
            opticalMap,
            idwLayer,
            IdwVector,
          ],
        },
        app.name
      );
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
      this.HsQueryPopupWidgetContainerService.create(
        PopupWidgetComponent,
        app,
        undefined
      );

      //Simulating ajax
      setTimeout(() => {
        this.HsEventBusService.layerDimensionDefinitionChanges.next({
          layer: opticalMap,
          app: app.name,
        });
      }, 100);
    }
  }
  title = 'hslayers-workspace';

  getRandomInt(min, max): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
