import {Component, OnInit, ViewEncapsulation} from '@angular/core';

import {
  HsConfig,
  HsDialogContainerService,
  HsLanguageService,
  HsLayoutService,
  HsPanelBaseComponent,
  HsSidebarService,
} from 'hslayers-ng';
import {HsStatisticsCorrelationsComponent} from './correlations.component';
import {HsStatisticsPredictionChartDialogComponent} from './prediction-chart-dialog.component';
import {HsStatisticsRegressionDialogComponent} from './regression-dialog.component';
import {HsStatisticsService} from './statistics.service';
import {HsStatisticsTimeSeriesChartDialogComponent} from './time-series-chart-dialog.component';
import {HsStatisticsToMapDialogComponent} from './to-map-dialog.component';
@Component({
  selector: 'hs-statistics',
  templateUrl: './statistics-panel.component.html',
  styleUrls: ['../styles.sass'],
  encapsulation: ViewEncapsulation.None,
})
export class HsStatisticsPanelComponent
  extends HsPanelBaseComponent
  implements OnInit {
  public title = '';
  name = 'statistics';
  appRef;
  constructor(
    private hsStatisticsService: HsStatisticsService,
    private hsConfig: HsConfig,
    hsLayoutService: HsLayoutService,
    private hsLanguageService: HsLanguageService,
    private hsSidebarService: HsSidebarService,
    private hsDialogContainerService: HsDialogContainerService
  ) {
    super(hsLayoutService);
  }

  ngOnInit() {
    this.hsSidebarService.addButton(
      {
        panel: 'statistics',
        module: 'hs.statistics',
        order: 10,
        fits: true,
        visible: true,
        title: 'PANEL_HEADER.STATISTICS',
        description: 'SIDEBAR.descriptions.STATISTICS',
        icon: 'statistics-icon-barchartasc',
      },
      this.data.app
    );
    this.setConfig();
    this.hsStatisticsService.init(this.data.app);
    this.appRef = this.hsStatisticsService.get(this.data.app);
  }
  setConfig() {
    this.hsConfig.update(
      {
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
              OPTIONAL: '(optional)',
              PREDICTIONS: 'Predictions',
              FROM: 'From',
              TILL: 'Till',
              STORE_MODEL: 'Store model',
              MODEL_NAME: 'Model name',
              FUNCTION: 'Function',
              DRAG_TO_DRAW: 'Drag mouse in this area to draw',
            },
          },
        },
      },
      this.data.app
    );
  }

  correlate(): void {
    this.hsDialogContainerService.create(
      HsStatisticsCorrelationsComponent,
      {
        correlate: this.hsStatisticsService.correlate({}, this.data.app),
        app: this.data.app,
      },
      this.data.app
    );
  }

  visualizeInMap(): void {
    this.hsDialogContainerService.create(
      HsStatisticsToMapDialogComponent,
      {
        rows: this.hsStatisticsService.get(this.data.app).corpus.dict,
        columns: this.hsStatisticsService.get(this.data.app).corpus.variables,
        uses: this.hsStatisticsService.get(this.data.app).corpus.uses,
      },
      this.data.app
    );
  }

  timeSeries(): void {
    this.hsDialogContainerService.create(
      HsStatisticsTimeSeriesChartDialogComponent,
      {
        rows: this.hsStatisticsService.get(this.data.app).corpus.dict,
        columns: this.hsStatisticsService.get(this.data.app).corpus.variables,
        uses: this.hsStatisticsService.get(this.data.app).corpus.uses,
        app: this.data.app,
      },
      this.data.app
    );
  }

  regression(): void {
    this.hsDialogContainerService.create(
      HsStatisticsRegressionDialogComponent,
      {app: this.data.app},
      this.data.app
    );
  }

  predict(): void {
    this.hsDialogContainerService.create(
      HsStatisticsPredictionChartDialogComponent,
      {app: this.data.app},
      this.data.app
    );
  }

  removeVariable(varSelected: string) {
    if (varSelected) {
      this.hsStatisticsService.get(this.data.app).corpus.variables =
        this.hsStatisticsService
          .get(this.data.app)
          .corpus.variables.filter((variable) => variable != varSelected);
    }
  }

  clearAll(): void {
    this.hsStatisticsService.clear(this.data.app);
  }
}
