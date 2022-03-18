import {Component} from '@angular/core';
import {DuplicateHandling} from './../../../hslayers/src/components/map/map.service';
import {HttpClient} from '@angular/common/http';

import Feature from 'ol/Feature';
import GeoJSON from 'ol/format/GeoJSON';
import Point from 'ol/geom/Point';
import {Circle, Fill, Stroke, Style} from 'ol/style';
import {Image as ImageLayer, Vector as VectorLayer} from 'ol/layer';
import {OSM, TileWMS, Vector as VectorSource, XYZ} from 'ol/source';
import {Projection} from 'ol/proj';
import {Tile} from 'ol/layer';
import {catchError, takeUntil} from 'rxjs';
import {containsExtent} from 'ol/extent';

import {HsConfig} from 'hslayers-ng/src/config.service';
import {HsEventBusService} from 'hslayers-ng/src/components/core/event-bus.service';
import {HsLanguageService} from 'hslayers-ng/src/components/language/language.service';
import {HsMapService} from 'hslayers-ng/src/components/map/map.service';
import {HsQueryPopupWidgetContainerService} from 'hslayers-ng/src/components/query/query-popup-widget-container.service';
import {HsToastService} from 'hslayers-ng/src/components/layout/toast/toast.service';
import {HsUtilsService} from 'hslayers-ng/src/components/utils/utils.service';
import {InterpolatedLayer} from '../../../hslayers/src/common/layers/interpolated-layer.class';
import {InterpolatedLayerModel} from 'hslayers-ng/src/common/layers/interpolated-layer.model';
import {PopupWidgetComponent} from './popup-widget.component';

class MyInterpolotedLayer extends InterpolatedLayer {
  constructor() {
    super();
  }

  /**
   * Fill cache vectorsource with features from get request
   * @param collection - Get request response feature collection
   * @param mapProjection - Map projection
   * @param weight - Weight property name
   * @param app - App identifier
   * @param extent - Current map extent
   */
  fillFeatures(
    collection: any,
    mapProjection: string | Projection,
    weight: string,
    app: string,
    extent?: number[]
  ): void {
    const appRef = this.get(app);
    const dataProj = (collection.crs || collection.srs) ?? 'EPSG:4326';
    collection.features = new GeoJSON().readFeatures(collection, {
      dataProjection: dataProj,
      featureProjection: mapProjection,
    });
    this.normalizeWeight(collection.features, weight);
    const cachedFeatures = appRef.idwCacheSource?.getFeatures();
    if (
      extent &&
      appRef.lastExtent &&
      containsExtent(extent, appRef.lastExtent) &&
      cachedFeatures?.length > 0
    ) {
      const filteredFeatures = collection.features.filter(
        (f) => !cachedFeatures.includes(f)
      );
      if (filteredFeatures?.length > 0) {
        appRef.idwCacheSource.addFeatures(filteredFeatures);
      }
    } else {
      appRef.idwCacheSource = new VectorSource({
        features: collection.features,
      });
    }
    appRef.lastExtent = extent ?? null;
  }

  /**
   * Create url for get request including current map extent
   * @param url - external source URL
   * @param extent - Current map extent
   */
  createIDWSourceUrl(url: string, extent: number[]): string {
    if (!url) {
      return;
    } else if (extent) {
      const extentObj = [
        {ref: 'minx', value: extent[0].toFixed(1)},
        {ref: 'miny', value: extent[1].toFixed(1)},
        {ref: 'maxx', value: extent[2].toFixed(1)},
        {ref: 'maxy', value: extent[3].toFixed(1)},
      ];
      const matches = url.match(/{.+?}/g);
      if (matches?.length > 0 && matches?.length <= 4) {
        for (const m of matches) {
          const ix = matches.indexOf(m);
          const key = m.replace(/[{}]/g, '').toLowerCase();
          const coord = extentObj.find((e) => e.ref === key) ?? extentObj[ix];
          url = url.replace(m, coord.value);
        }
      }
    }
    return url;
  }
}

@Component({
  selector: 'hslayers-app',
  templateUrl: './hslayers-app.component.html',
  styleUrls: ['./hslayers-app.component.scss'],
})
export class HslayersAppComponent {
  interpolatedLayerClass: InterpolatedLayerModel;
  constructor(
    public hsConfig: HsConfig,
    private hsEventBusService: HsEventBusService,
    private hsQueryPopupWidgetContainerService: HsQueryPopupWidgetContainerService,
    private hsToastService: HsToastService,
    private hsLanguageService: HsLanguageService,
    private hsUtilsService: HsUtilsService,
    private httpClient: HttpClient,
    private hsMapService: HsMapService
  ) {
    const apps = [
      {
        name: 'default',
        panelsEnabled: {
          compositionLoadingProgress: true,
          draw: true,
          tripPlanner: true,
          mapSwipe: true,
          feature_table: true,
        },
        sidebarPosition: 'right',
      },
      {
        name: 'app-2',
        panelsEnabled: {
          compositionLoadingProgress: true,
          tripPlanner: true,
          mapSwipe: false,
          feature_table: true,
        },
        sidebarPosition: 'left',
      },
    ];
    this.hsEventBusService.mapExtentChanges.subscribe(({e, app}) => {
      this.interpolatedLayerClass.get(app).cancelUrlRequest.next();
      this.createInterpotedLayerSource(app);
    });
    for (const app of apps) {
      this.interpolatedLayerClass = new MyInterpolotedLayer();

      this.interpolatedLayerClass
        .get(app.name)
        .cancelUrlRequest.subscribe((_) => {
          this.removeLoadingToast(app.name);
        });
      this.createInterpotedLayerSource(app.name);
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
      this.hsConfig.update(
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
            // {
            //   title: 'Micka',
            //   url: 'https://hub.lesprojekt.cz/micka/csw',
            //   language: 'eng',
            //   type: 'micka',
            // },
          ],
          proxyPrefix: window.location.hostname.includes('localhost')
            ? `${window.location.protocol}//${window.location.hostname}:8085/`
            : '/proxy/',
          panelsEnabled: app.panelsEnabled,
          mapSwipeOptions: {
            orientation: 'vertical',
          },
          layersInFeatureTable: [points],
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
                title: 'OpenStreet Map',
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
      this.hsQueryPopupWidgetContainerService.create(
        PopupWidgetComponent,
        app,
        undefined
      );

      //Simulating ajax
      setTimeout(() => {
        this.hsEventBusService.layerDimensionDefinitionChanges.next({
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

  /**
   * Remove warning toast when get request completes
   * @param app - App identifier
   */
  removeLoadingToast(app: string): void {
    this.hsToastService.removeByText(
      this.hsLanguageService.getTranslation(
        'Loading IDW layer source, please wait!',
        undefined,
        app
      ),
      app
    );
  }

  /**
   * Get IDW source from creating interpolated ol layer
   * @param url - external source URL
   * @param weight - Weight property name
   * @param mapProjection - Map projection
   * @param extent - Current map extent
   * @param app - App identifier
   */
  async getIDWSource(
    interpolatedLayer: InterpolatedLayerModel,
    url: string,
    weight: string,
    mapProjection: string | Projection,
    extent: number[],
    app: string
  ): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const idwRef = interpolatedLayer.get(app);
      let features = [];
      url = interpolatedLayer.createIDWSourceUrl(url, extent);
      if (url && !interpolatedLayer.cacheAvailable(extent, app)) {
        this.hsToastService.createToastPopupMessage(
          await this.hsLanguageService.awaitTranslation(
            'IDW layer request',
            undefined,
            app
          ),
          'Loading IDW layer source, please wait!',
          {
            disableLocalization: true,
            toastStyleClasses: 'bg-warning text-light',
            serviceCalledFrom: 'HsIDWLayerService',
            customDelay: 60000,
          },
          app
        );
        this.httpClient
          .get(this.hsUtilsService.proxify(url, app))
          .pipe(
            takeUntil(idwRef.cancelUrlRequest),
            catchError(async (e) => {
              this.removeLoadingToast(app);
              this.hsToastService.createToastPopupMessage(
                await this.hsLanguageService.awaitTranslation(
                  'IDW layer request',
                  undefined,
                  app
                ),
                'Failed to load IDW source',
                {
                  disableLocalization: true,
                  serviceCalledFrom: 'HsIDWLayerService',
                },
                app
              );
            })
          )
          .subscribe(async (response: any) => {
            this.removeLoadingToast(app);
            if (response?.features?.length > 0) {
              interpolatedLayer.fillFeatures(
                response,
                mapProjection,
                weight,
                app,
                extent
              );
              this.hsToastService.createToastPopupMessage(
                await this.hsLanguageService.awaitTranslation(
                  'IDW layer request',
                  undefined,
                  app
                ),
                'IDW source loaded',
                {
                  disableLocalization: true,
                  toastStyleClasses: 'bg-success text-light',
                  serviceCalledFrom: 'HsIDWLayerService',
                },
                app
              );
              features = idwRef.idwCacheSource.getFeatures();
              resolve(interpolatedLayer.createIDWSource(features));
            }
          });
      } else {
        idwRef.idwCacheSource.forEachFeatureIntersectingExtent(
          extent,
          (feature) => {
            features.push(feature);
          }
        );
        resolve(interpolatedLayer.createIDWSource(features));
      }
    });
  }

  async createInterpotedLayerSource(app: string): Promise<void> {
    await this.hsMapService.loaded(app);
    const extent = this.hsMapService.getMapExtentInEpsg4326(app);
    const projection = this.hsMapService.getCurrentProj(app);
    const idwSource = await this.getIDWSource(
      this.interpolatedLayerClass,
      'https://api-agroclimatic.lesprojekt.cz/area/selection/preci/0/{minY}/{maxY}/{minX}/{maxX}/105/regularstep/year/2000/2000/0/0/0000-00-00/0000-00-00/0/0/ERA5-Land',
      'dwn2020',
      projection,
      extent,
      app
    );
    const layer = new ImageLayer({
      properties: {title: 'IDW layer'},
      source: idwSource,
      opacity: 0.5,
    });
    this.hsMapService.addLayer(layer, app, DuplicateHandling.RemoveOriginal);
  }
}
