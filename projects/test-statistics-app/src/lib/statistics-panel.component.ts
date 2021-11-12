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
import {HsStatisticsService} from './statistics.service';
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

  removeVariable(){
    
  }
}
