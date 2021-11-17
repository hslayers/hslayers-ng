import {Component} from '@angular/core';

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
    private hsDialogContainerService: HsDialogContainerService
  ) {
    super(hsLayoutService);
    hsSidebarService.buttons.push({
      panel: 'statistics',
      module: 'hs.statistics',
      order: 10,
      fits: true,
      title: () => hsLanguageService.getTranslation('PANEL_HEADER.STATISTICS'),
      description: () =>
        hsLanguageService.getTranslation('SIDEBAR.descriptions.STATISTICS'),
      icon: 'icon-barchartasc',
    });
  }

  correlate(): void {
    this.hsDialogContainerService.create(
      HsStatisticsCorrelationsComponent,
      this.hsStatisticsService.correlate()
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
}
