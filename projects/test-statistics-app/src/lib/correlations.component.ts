import {Component, Input, ViewRef} from '@angular/core';

import {HsDialogComponent, HsDialogContainerService} from 'hslayers-ng';
@Component({
  selector: 'hs-correlations',
  templateUrl: './correlations.component.html',
})
export class HsStatisticsCorrelationsComponent implements HsDialogComponent {
  @Input() data: any;
  viewRef: ViewRef;

  constructor(public HsDialogContainerService: HsDialogContainerService) {}

  close(): void {
    this.HsDialogContainerService.destroy(this);
  }
}
