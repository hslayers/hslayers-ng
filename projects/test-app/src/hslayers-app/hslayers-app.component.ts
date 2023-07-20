import {Component} from '@angular/core';
import {HttpClient} from '@angular/common/http';

import Feature from 'ol/Feature';
import {Circle, Fill, Stroke, Style} from 'ol/style';
import {GeoJSON} from 'ol/format';
import {Image as ImageLayer, Vector as VectorLayer} from 'ol/layer';
import {OSM, TileWMS, Vector as VectorSource, XYZ} from 'ol/source';
import {Point} from 'ol/geom';
import {Tile} from 'ol/layer';
import {catchError, lastValueFrom, takeUntil} from 'rxjs';
import {transformExtent} from 'ol/proj';

import {HsConfig} from 'hslayers-ng/config.service';
import {HsEventBusService} from 'hslayers-ng/components/core/event-bus.service';
import {HsLayoutService} from 'hslayers-ng/components/layout/layout.service';
import {HsPanelContainerService} from 'hslayers-ng/components/layout/panels/panel-container.service';
import {HsQueryPopupWidgetContainerService} from 'hslayers-ng/components/query/query-popup-widget-container.service';
import {HsSidebarService} from 'hslayers-ng/components/sidebar/sidebar.service';
import {HsUtilsService} from 'hslayers-ng/components/utils/utils.service';
import {InterpolatedSource} from 'hslayers-ng/common/layers/hs.source.interpolated';
import {SPOI} from 'hslayers-ng/common/layers/hs.source.SPOI';
import {SparqlJson} from 'hslayers-ng/common/layers/hs.source.SparqlJson';

import {PopupWidgetComponent} from './popup-widget.component';
import {SomeComponent} from './some-panel/some-panel.component';

@Component({
  selector: 'hslayers-app',
  templateUrl: './hslayers-app.component.html',
  styleUrls: ['./hslayers-app.component.scss'],
})
export class HslayersAppComponent {
  constructor(
    public hsConfig: HsConfig,
    private hsEventBusService: HsEventBusService,
    private hsQueryPopupWidgetContainerService: HsQueryPopupWidgetContainerService,
    private hsUtilsService: HsUtilsService,
    private httpClient: HttpClient,
    public hsSidebarService: HsSidebarService,
    public hsPanelContainerService: HsPanelContainerService,
    public hsLayoutService: HsLayoutService,
  ) {
    /* Create new button in the sidebar */
    this.hsSidebarService.addButton({
      panel: 'custom',
      module: 'some',
      order: 0,
      title: 'Custom panel',
      description: 'Custom panel with some fancy features',
      icon: 'icon-analytics-piechart',
    });
    /* Create new panel itself */
    this.hsPanelContainerService.create(SomeComponent, {});
    /* Switch to it */
    this.hsEventBusService.layoutLoads.subscribe(() => {
      this.hsLayoutService.setDefaultPanel('custom');
    });

    const interpolatedSource = new InterpolatedSource({
      maxFeaturesInCache: 500,
      maxFeaturesInExtent: 100,
      features: [],
      weight: 'fac2020',
      loader: async ({extent, projection}) => {
        interpolatedSource.cancelUrlRequest.next();
        const extentIn4326 = transformExtent(extent, projection, 'EPSG:4326');
        const url = this.hsUtilsService.proxify(
          interpolatedSource.createIDWSourceUrl(
            'https://api-agroclimatic.lesprojekt.cz/area/selection/preci/0/{minY}/{maxY}/{minX}/{maxX}/100/random/year/2020/2020/1/5/2020-01-01/2020-01-30/1/1/ERA5-Land',
            extentIn4326,
          ),
        );
        try {
          const response: any = await lastValueFrom(
            this.httpClient.get(url).pipe(
              takeUntil(interpolatedSource.cancelUrlRequest),
              catchError(async (e) => {}),
            ),
          );
          return interpolatedSource.parseFeatures(response, projection);
        } catch (error) {}
      },
      colorMap: 'copper',
    });
    const idwLayer = new ImageLayer({
      visible: false,
      properties: {title: 'IDW layer'},
      source: interpolatedSource as any,
      opacity: 0.5,
    });

    //Mandatory, otherwise nothing will be loaded with source loader
    const idwVectorLayer = new VectorLayer({
      visible: true,
      properties: {
        title: 'IDW vector source',
        showInLayerManager: false,
        visible: idwLayer.getVisible(),
      },
      style: new Style(),
      source: interpolatedSource.getSource(),
    });
    idwLayer.on('change:visible', (e) => {
      idwVectorLayer.setVisible(e.target.getVisible());
    });
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
      visible: true,
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
    this.hsConfig.update({
      panelsEnabled: {
        compositionLoadingProgress: true,
        draw: true,
        mapSwipe: true,
      },
      sidebarPosition: 'right',
      //TODO: Migrate to watlas
      // base_layers: {
      //   url: 'https://hub.lesprojekt.cz/rest/workspaces/leitnerfilip/maps/corine_layerorder/file',
      //   default: 'CORINE Land Cover 2006',
      // },
      /*defaultComposition:
            'https://atlas2.kraj-lbc.cz/rest/workspaces/fzadrazil/maps/vodstvo',*/
      panelWidths: {
        custom: 555,
      },
      open_lm_after_comp_loaded: false,
      queryPopupWidgets: ['layer-name', 'feature-info', 'clear-layer'],
      datasources: [
        {
          title: 'Layman',
          url: 'http://localhost:8087',
          type: 'layman',
        },
        {
          title: 'Micka',
          url: 'https://hub4everybody.com/micka/csw',
          language: 'eng',
          type: 'micka',
        },
      ],
      proxyPrefix: window.location.hostname.includes('localhost')
        ? `${window.location.protocol}//127.0.0.1:8085/`
        : '/proxy/',
      mapSwipeOptions: {
        orientation: 'vertical',
      },
      layersInFeatureTable: [points],
      componentsEnabled: {
        basemapGallery: true,
        mapSwipe: true,
      },
      enabledLanguages: 'sk, cs, en',
      language: 'en',
      assetsPath: 'assets',
      saveMapStateOnReload: false,
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
      errorToastDuration: 1000,
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
            title: 'POIs from SPOI in Italy',
            cluster: true,
            editor: {editable: false},
            editable: false,
          },
          source: new SparqlJson({
            geomAttribute: '?geom',
            endpointUrl: 'https://www.foodie-cloud.org/sparql',
            query: `SELECT ?s ?p ?o ?geom
                FROM <http://www.sdi4apps.eu/poi.rdf>
                WHERE {
                  ?s <http://www.opengis.net/ont/geosparql#asWKT> ?geom.
                  ?s geo:sfWithin <http://www.geonames.org/3175395>.
                  FILTER(isBlank(?geom) = false).
                  <extent> ?s ?p ?o.
                } ORDER BY ?s`,
            optimization: 'virtuoso',
            projection: 'EPSG:3857',
          }),
          minZoom: 12,
          visible: false,
        }),
        new VectorLayer({
          properties: {
            title: 'Cafés from SPOI (world-wide)',
            cluster: true,
            editor: {editable: false},
            editable: false,
          },
          source: new SPOI({
            category: 'cafe',
            projection: 'EPSG:3857',
          }),
          style: new Style({
            image: new Circle({
              fill: new Fill({
                color: 'rgba(255, 204, 102, 0.7)',
              }),
              stroke: new Stroke({
                color: 'rgb(230, 46, 0)',
                width: 1,
              }),
              radius: 5,
            }),
          }),
          minZoom: 11,
          visible: false,
        }),
        new VectorLayer({
          visible: true,
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
            domFeatureLinks: [
              {
                domSelector: '#poly1',
                feature: 'poly1',
                event: 'mouseover',
                actions: ['zoomToExtent', 'select'],
              },
              {
                domSelector: '#poly2',
                feature: 'poly2',
                event: 'mouseover',
                actions: ['zoomToExtent', 'showPopup'],
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
          visible: true,
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
                  'name',
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
          visible: false,
          properties: {
            title: 'Latvian municipalities (parent layer)',
            queryFilter: (map, layer, pixel) => {
              return true;
            },
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
          visible: false,
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
        new Tile({
          visible: false,
          properties: {
            title: 'EVI',
          },
          source: new TileWMS({
            url: 'https://eo.lesprojekt.cz/geoserver/nemecek/wms',
            params: {
              LAYERS: 'EVI',
              INFO_FORMAT: undefined,
              FORMAT: 'image/png; mode=8bit',
            },
            crossOrigin: 'anonymous',
          }),
        }),
        opticalMap,
        idwLayer,
        idwVectorLayer,
      ],
      timeDisplayFormat: 'dd.MM.yyyy.',
      translationOverrides: {
        lv: {
          LAYERS: {
            'Latvian municipalities (1 sub-layer)':
              'Latvijas novadi (1 apakšslānis)',
          },
        },
      },
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
    this.hsQueryPopupWidgetContainerService.create(
      PopupWidgetComponent,
      undefined,
    );

    //Simulating ajax
    setTimeout(() => {
      this.hsEventBusService.layerDimensionDefinitionChanges.next(opticalMap);
    }, 100);
  }
  title = 'hslayers-workspace';

  getRandomInt(min, max): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
