import {Component, Input, ViewRef} from '@angular/core';

import {HsDialogComponent, HsDialogContainerService} from 'hslayers-ng';
import {HsStatisticsService, ShiftBy} from './statistics.service';

export enum Tabs {
  varList = 'variableList',
  corrMatrix = 'correlationMatrix',
}
@Component({
  selector: 'hs-correlations',
  templateUrl: './correlations.component.html',
  styles: [
    `
      th,
      td {
        border: 1px solid #dddddd;
        text-align: left;
        padding: 6px;
        font-size: 14px;
      }
    `,
  ],
})
export class HsStatisticsCorrelationsComponent implements HsDialogComponent {
  @Input() data: {
    correlate: any;
    app: string;
  };
  viewRef: ViewRef;
  tabs = Tabs;
  tabSelected = Tabs.varList;
  shifts: ShiftBy = {};

  constructor(
    public HsDialogContainerService: HsDialogContainerService,
    private HsStatisticsService: HsStatisticsService
  ) {}

  close(): void {
    this.HsDialogContainerService.destroy(this, this.data.app);
  }

  updateShifting(variable: string, shiftBy: number) {
    this.shifts[variable] = shiftBy;
    this.data.correlate = this.HsStatisticsService.correlate(
      this.shifts,
      this.data.app
    );
  }

  tabSelect(tabTitle: Tabs): void {
    this.tabSelected = tabTitle;
  }
}
