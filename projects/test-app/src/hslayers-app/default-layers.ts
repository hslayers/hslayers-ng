import {catchError, lastValueFrom, takeUntil} from 'rxjs';
import {HttpClient} from '@angular/common/http';

import Circle from 'ol/style/Circle';
import Feature from 'ol/Feature';
import Fill from 'ol/style/Fill';
import GeoJSON from 'ol/format/GeoJSON';
import ImageLayer from 'ol/layer/Image';
import type ImageSource from 'ol/source/Image';
import type Layer from 'ol/layer/Layer';
import Point from 'ol/geom/Point';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';
import Tile from 'ol/layer/Tile';
import type TileLayer from 'ol/layer/Tile';
import TileWMS from 'ol/source/TileWMS';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import XYZ from 'ol/source/XYZ';
import {transformExtent} from 'ol/proj';

import {HsProxyService} from 'hslayers-ng/services/utils';
import {InterpolatedSource, SPOI, SparqlJson} from 'hslayers-ng/common/layers';

export interface DefaultLayersDeps {
  httpClient: HttpClient;
  hsProxyService: HsProxyService;
}

export interface DefaultLayersResult {
  defaultLayers: Layer[];
  layersInFeatureTable: VectorLayer[];
  /** Call with an emit function to trigger layerDimensionDefinitionChanges for the optical map after a short delay. */
  notifyOpticalMapDimensions?: (emit: (layer: TileLayer) => void) => void;
}

function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function createDefaultLayers(
  deps: DefaultLayersDeps,
): DefaultLayersResult {
  const {httpClient, hsProxyService} = deps;

  const imageWmsTSource = new TileWMS({
    url: 'http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/dima/maps/veg_indexy.map&SERVICE=WMS',
    params: {
      LAYERS: 'tci',
    },
  });
  const imageWmsTLayer = new Tile({
    properties: {
      title: 'Vegetation Satellite Image',
      base: false,
      removable: false,
      dimensions: {time: {value: '2020-01-11'}},
    },
    source: imageWmsTSource,
    visible: false,
  });

  const interpolatedSource = new InterpolatedSource({
    maxFeaturesInCache: 500,
    maxFeaturesInExtent: 100,
    features: [],
    weight: 'fac2020',
    loader: async ({extent, projection}) => {
      interpolatedSource.cancelUrlRequest.next();
      const extentIn4326 = transformExtent(extent, projection, 'EPSG:4326');
      const url = hsProxyService.proxify(
        interpolatedSource.createIDWSourceUrl(
          'https://api-agroclimatic.lesprojekt.cz/area/selection/preci/0/{minY}/{maxY}/{minX}/{maxX}/100/random/year/2020/2020/1/5/2020-01-01/2020-01-30/1/1/ERA5-Land',
          extentIn4326,
        ),
      );
      try {
        const response: unknown = await lastValueFrom(
          httpClient.get(url as string).pipe(
            takeUntil(interpolatedSource.cancelUrlRequest),
            catchError(async () => ({})),
          ),
        );
        return interpolatedSource.parseFeatures(
          response as Record<string, unknown>,
          projection,
        );
      } catch {
        return [];
      }
    },
    colorMap: 'copper',
  });
  const idwLayer = new ImageLayer({
    visible: false,
    properties: {title: 'IDW layer'},
    source: interpolatedSource as unknown as ImageSource,
    opacity: 0.5,
  });

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
  idwLayer.on('change:visible', (e: {target: {getVisible: () => boolean}}) => {
    idwVectorLayer.setVisible(e.target.getVisible());
  });

  const count = 200;
  const features = new Array(count);
  const e = 4500000;
  for (let i = 0; i < count; ++i) {
    const coordinates = [2 * e * Math.random() - e, 2 * e * Math.random() - e];
    features[i] = new Feature({
      geometry: new Point(coordinates),
      name: 'test',
      population: Math.round(Math.random() * 5000000),
      val: getRandomInt(0, 100),
    });
  }

  const geojsonObject = {
    type: 'FeatureCollection',
    crs: {
      type: 'name',
      properties: {
        name: 'EPSG:3857',
      },
    },
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-5e6, 6e6],
              [-5e6, 8e6],
              [-3e6, 8e6],
              [-3e6, 6e6],
              [-5e6, 6e6],
            ],
          ],
        },
        properties: {
          name: 'Poly 3',
          id: 'poly1',
          population: Math.floor(Math.random() * 100000),
        },
        id: 'poly1',
      },
      {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-2e6, 6e6],
              [-2e6, 8e6],
              [0, 8e6],
              [0, 6e6],
              [-2e6, 6e6],
            ],
          ],
        },
        properties: {
          name: 'Poly 2',
          id: 'poly2',
          population: Math.floor(Math.random() * 100000),
        },
        id: 'poly2',
      },
      {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [1e6, 6e6],
              [1e6, 8e6],
              [3e6, 8e6],
              [3e6, 6e6],
              [1e6, 6e6],
            ],
          ],
        },
        properties: {
          name: 'Poly 4',
          population: Math.floor(Math.random() * 100000),
        },
      },
      {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-2e6, -1e6],
              [-1e6, 1e6],
              [0, -1e6],
              [-2e6, -1e6],
            ],
          ],
        },
        properties: {
          name: 'Poly 1',
          population: Math.floor(Math.random() * 100000),
        },
      },
    ],
  };

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

  const points = new VectorLayer({
    visible: true,
    properties: {
      title: 'Points',
      synchronize: false,
      swipeSide: 'left',
      cluster: false,
      inlineLegend: true,
      autoLegend: false,
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
  const pointLegend = [
    {color: 'rgba(58, 168, 55, 0.85)', name: 'implemented status'},
    {color: 'rgba(174, 203, 6, 0.85)', name: 'planned status'},
    {color: 'rgba(6, 89, 155, 0.85)', name: 'idea status'},
    {color: 'rgba(239, 135, 3, 0.85)', name: 'INTERREG status'},
    {color: 'rgba(155, 155, 155, 0.85)', name: 'unknown status'},
    {
      path: 'https://pluschange.plan4all.eu/maps/nbs/assets/icons/wet_valley.svg',
      name: 'wet valleys',
      height: 32,
    },
  ];
  points.getSource()?.set('legendCategories', pointLegend);

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

  const defaultLayers: Layer[] = [
    imageWmsTLayer,
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
        maxResolution: 5000,
        minResolution: 5500,
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
      maxResolution: 50,
      minResolution: 45,
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
          widgets: ['layer-name', 'clear-layer'],
          displayFunction: function (feature: Feature) {
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
        queryFilter: () => true,
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
        url: 'http://localhost:8087/geoserver/jmacura_wms/ows',
        params: {
          LAYERS: 'zones_evi_ugly_test_hsl,zones',
          INFO_FORMAT: undefined,
          FORMAT: 'image/png; mode=8bit',
        },
        crossOrigin: 'anonymous',
      }),
    }),
    opticalMap,
    idwLayer,
    idwVectorLayer,
  ];

  const dimensions = opticalMap.get('dimensions') as
    | {time?: {values?: string[]}}
    | undefined;
  if (dimensions?.time) {
    dimensions.time.values = [
      '2019-02-17',
      '2019-02-22',
      '2019-04-03',
      '2019-04-05',
      '2019-04-18',
    ];
  }

  return {
    defaultLayers,
    layersInFeatureTable: [points],
    notifyOpticalMapDimensions: (emit: (layer: typeof opticalMap) => void) => {
      setTimeout(() => emit(opticalMap), 100);
    },
  };
}
