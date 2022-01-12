import {Component, ViewEncapsulation} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';

import {
  HsConfig,
  HsDialogContainerService,
  HsLanguageService,
  HsLayoutService,
  HsPanelBaseComponent,
  HsSidebarService,
} from 'hslayers-ng';
import {HsStatisticsCorrelationsComponent} from './correlations.component';
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
export class HsStatisticsPanelComponent extends HsPanelBaseComponent {
  public title = '';
  name = 'statistics';

  constructor(
    public hsStatisticsService: HsStatisticsService,
    public hsConfig: HsConfig,
    hsLayoutService: HsLayoutService,
    hsLanguageService: HsLanguageService,
    hsSidebarService: HsSidebarService,
    private hsDialogContainerService: HsDialogContainerService,
    private TranslateService: TranslateService
  ) {
    super(hsLayoutService);
    hsSidebarService.buttons.push({
      panel: 'statistics',
      module: 'hs.statistics',
      order: 10,
      fits: true,
      visible: true,
      title: () => hsLanguageService.getTranslation('PANEL_HEADER.STATISTICS'),
      description: () =>
        hsLanguageService.getTranslation('SIDEBAR.descriptions.STATISTICS'),
      icon: 'icon-barchartasc',
    });
    this.setConfig();
  }
  setConfig() {
    this.hsConfig.update({
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
    });
    this.TranslateService.reloadLang(
      this.TranslateService.currentLang ?? this.TranslateService.defaultLang
    );
  }

  correlate(): void {
    this.hsDialogContainerService.create(
      HsStatisticsCorrelationsComponent,
      this.hsStatisticsService.correlate({})
    );
  }

  visualizeInMap(): void {
    this.hsDialogContainerService.create(HsStatisticsToMapDialogComponent, {
      rows: this.hsStatisticsService.corpus.dict,
      columns: this.hsStatisticsService.corpus.variables,
      uses: this.hsStatisticsService.corpus.uses,
    });
  }

  timeSeries(): void {
    this.hsDialogContainerService.create(
      HsStatisticsTimeSeriesChartDialogComponent,
      {
        rows: this.hsStatisticsService.corpus.dict,
        columns: this.hsStatisticsService.corpus.variables,
        uses: this.hsStatisticsService.corpus.uses,
      }
    );
  }

  regression(): void {
    this.hsDialogContainerService.create(
      HsStatisticsRegressionDialogComponent,
      {}
    );
  }

  removeVariable(varSelected: string) {
    if (varSelected) {
      this.hsStatisticsService.corpus.variables =
        this.hsStatisticsService.corpus.variables.filter(
          (variable) => variable != varSelected
        );
    }
  }

  clearAll(): void {
    this.hsStatisticsService.clear();
  }
}
