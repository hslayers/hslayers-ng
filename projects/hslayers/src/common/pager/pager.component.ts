import {Component, Input} from '@angular/core';

@Component({
  selector: 'hs-pager',
  templateUrl: './pager.component.html',
})
export class HsPagerComponent {
  @Input() pagerService: any;
  recordsPerPageArray = [5, 10, 15, 20, 25, 50, 100];
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
   * Load previous list of items to display on pager
   */
  getPreviousRecords(): void {
    if (this.pagerService.getPreviousRecords) {
      this.pagerService.getPreviousRecords();
    } else {
      if (this.pagerService.listStart - this.pagerService.recordsPerPage <= 0) {
        this.pagerService.listStart = 0;
        this.pagerService.listNext = this.pagerService.recordsPerPage;
      } else {
        this.pagerService.listStart -= this.pagerService.recordsPerPage;
        this.pagerService.listNext =
          this.pagerService.listStart + this.pagerService.recordsPerPage;
      }
    }
  }

  changeRecordsPerPage(perPage: number): void {
    if (perPage > this.pagerService.matchedRecords) {
      this.pagerService.recordsPerPage = this.pagerService.matchedRecords;
    } else {
      this.pagerService.recordsPerPage = perPage;
    }
    this.pagerService.listStart = 0;
    this.pagerService.listNext = this.pagerService.recordsPerPage;
    if (this.pagerService.changeRecordsPerPage) {
      this.pagerService.changeRecordsPerPage();
    }
  }

  /**
   * Load next list of items to display on pager
   */
  getNextRecords(): void {
    if (this.pagerService.getNextRecords) {
      this.pagerService.getNextRecords();
    } else {
      this.pagerService.listStart += this.pagerService.recordsPerPage;
      this.pagerService.listNext += this.pagerService.recordsPerPage;
      if (this.pagerService.listNext > this.pagerService.matchedRecords) {
        this.pagerService.listNext = this.pagerService.matchedRecords;
      }
    }
  }

  resultsVisible(): boolean {
    return this.pagerService.listNext && this.pagerService.matchedRecords
      ? true
      : false;
  }
}
