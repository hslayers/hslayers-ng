import {Component, Input} from '@angular/core';

@Component({
  selector: 'hs-pager',
  templateUrl: './pager.component.html',
})
export class HsPagerComponent {
  @Input() pagerService: any;
  constructor() {}

  /**
   * Checks if next page for pagination is available
   */
  nextPageAvailable(): boolean {
    if (
      this.pagerService.listNext == this.pagerService.matchedRecords ||
      this.pagerService.matchedRecords == 0
    ) {
      return true;
    } else {
      return false;
    }
  }
  /**
   * Load previous list of compositions to display on pager
   */
  getPreviousRecords(): void {
    this.pagerService.getPreviousRecords();
  }

  /**
   * Load next list of compositions to display on pager
   */
  getNextRecords(): void {
    this.pagerService.getNextRecords();
  }

  resultsVisible(): boolean {
    return this.pagerService.listNext && this.pagerService.matchedRecords
      ? true
      : false;
  }
}
