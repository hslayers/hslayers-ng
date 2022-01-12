import {Component} from '@angular/core';

import GeoJSON from 'ol/format/GeoJSON';
import {OSM, Vector as VectorSource, XYZ} from 'ol/source';
import {Tile} from 'ol/layer';
import {Vector as VectorLayer} from 'ol/layer';

import vidzeme from '../assets/vidzeme.json';
import {
  HsConfig,
  HsEventBusService,
  HsLayerManagerComponent,
  HsLayoutService,
  HsQueryComponent,
  HsQueryPopupComponent,
  HsQueryPopupService,
  HsSearchToolbarComponent,
  HsStylerComponent,
  HsToolbarPanelContainerService,
} from 'hslayers-ng';
import {HsStatisticsPanelComponent} from '../lib/statistics-panel.component';
import {HsStatisticsUploadPanelComponent} from '../lib/upload-panel';

@Component({
  selector: 'hslayers-app',
  templateUrl: './app.component.html',
  styleUrls: [],
})
export class HslayersAppComponent {
  constructor(
    public HsConfig: HsConfig,
    private HsEventBusService: HsEventBusService,
    hsLayoutService: HsLayoutService,
    hsQueryPopupService: HsQueryPopupService,
    hsToolbarPanelContainerService: HsToolbarPanelContainerService
  ) {
    this.HsConfig.update({
      datasources: [
        {
          title: 'Layman',
          url: 'http://localhost:8087',
          user: 'anonymous',
          type: 'layman',
          liferayProtocol: 'https',
        },
      ],
      proxyPrefix: window.location.hostname.includes('localhost')
        ? `${window.location.protocol}//${window.location.hostname}:8085/`
        : '/proxy/',
      panelsEnabled: {
        tripPlanner: true,
        info: true,
        compositionLoadingProgress: true,
      },
      componentsEnabled: {
        geolocationButton: true,
        guiOverlay: true,
      },
      assetsPath: 'assets',
      symbolizerIcons: [
        {name: 'bag', url: '/assets/icons/bag1.svg'},
        {name: 'banking', url: '/assets/icons/banking4.svg'},
        {name: 'bar', url: '/assets/icons/bar.svg'},
        {name: 'beach', url: '/assets/icons/beach17.svg'},
        {name: 'bicycles', url: '/assets/icons/bicycles.svg'},
        {name: 'building', url: '/assets/icons/building103.svg'},
        {name: 'bus', url: '/assets/icons/bus4.svg'},
      ],
      popUpDisplay: 'hover',
      panelWidths: {statistics: 600, 'statistics-upload': 700},
      translationOverrides: {
        en: {
          SIDEBAR: {
            descriptions: {
              UPLOAD: 'Upload tabular data',
              STATISTICS: 'Calculate statistics',
            },
          },
          PANEL_HEADER: {
            STATISTICS: 'Statistics',
            UPLOAD: 'Upload tabular data',
          },
          STATISTICS: {
            AGO: 'ago',
            BY: 'by',
            CLEAR_ALL_DATA: 'Clear all data',
            CLEAR_ALL_STATISTICS_DATA:
              'Do you really want to clear all statistics data?',
            COLLAPSE_ROWS: 'Collapse rows',
            CORRELATE: 'Correlate',
            CORRELATION_MATRIX: 'Correlation matrix',
            CORRELATIONS: 'Correlations',
            CURRENT_VARIABLES: 'Current variables',
            DESCRIPTIVE_STATISTICS: 'Descriptive statistics',
            FREQUENCY: 'Frequency',
            INTERVALS: 'Intervals',
            LOCATION_FILTER: 'Location',
            MAXIMUM: 'Maximum',
            MEAN_ABSOLUTE_DEVIATION: 'Mean absolute deviation',
            MEAN: 'Mean',
            MEDIAN: 'Median',
            MINIMUM: 'Minimum',
            MODE: 'Mode',
            NUMBER_OF_STUDENTS: 'Number of students',
            PEARSONS_OFFSET_COEFFICIENT: "Pearson's offset coefficient",
            PREDICT: 'Predict',
            REGRESSION_TYPE: 'Type',
            REGRESSION: 'Regression',
            removeVariable: 'Remove variable',
            SHIFT: 'Shift',
            STANDARD_DEVIATION: 'Standard deviation',
            STORE: 'Store',
            TIME_FILTER: 'Filter by time',
            TIME_SERIES_CHART: 'Time series chart',
            TIMESTAMP: 'Timestamp',
            VALUE: 'Value',
            VARIABLE_LIST: 'Variable list',
            VARIABLE: 'Variable',
            VARIABLES: 'Variables',
            VARIANCE: 'Variance',
            VISUALIZE_MAP: 'To map',
            VISUALIZE: 'Visualize',
            YEARS: 'years',
            LOCATION_PROPERTY: 'Location property',
            DOWNLOAD_TEMPLATE_HINT: `Upload data in CSV format. A template can be downloaded`,
            HERE: 'here',
          },
        },
      },
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
            title: 'Municipalities',
            synchronize: false,
            cluster: false,
            inlineLegend: true,
            popUp: {
              attributes: ['LABEL', 'value'],
            },
            editor: {
              editable: true,
              defaultAttributes: {
                name: 'New polygon',
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
                    <PolygonSymbolizer>
                    <Fill>
                      <CssParameter name="fill">#51a6d1</CssParameter>
                    </Fill>
                  </PolygonSymbolizer>
                    </Rule>
                  </FeatureTypeStyle>
                </UserStyle>
              </NamedLayer>
            </StyledLayerDescriptor>
            `,
            path: 'User generated',
          },
          source: new VectorSource({
            features: new GeoJSON().readFeatures(vidzeme, {
              dataProjection: 'EPSG:4326',
              featureProjection: 'EPSG:3857',
            }),
          }),
        }),
      ],
    });
    hsLayoutService.createPanel(HsQueryComponent, {});
    hsLayoutService.createPanel(HsStatisticsPanelComponent, {});
    hsLayoutService.createPanel(HsLayerManagerComponent, {});
    hsLayoutService.createPanel(HsStylerComponent, {});
    hsToolbarPanelContainerService.create(HsSearchToolbarComponent, {});
    hsLayoutService.createOverlay(HsQueryPopupComponent, {
      service: hsQueryPopupService,
    });
  }
  title = 'hslayers-workspace';
}
