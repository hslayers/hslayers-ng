import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'hs-pager',
  templateUrl: './pager.component.html',
})
export class HsPagerComponent implements OnInit {
  @Input() app: string;
  @Input() pagerService: any;

  appRef;
  recordsPerPageArray = [5, 10, 15, 20, 25, 50, 100];
  constructor() {}

  ngOnInit() {
    this.appRef = this.pagerService.get(this.app);
  }

  /**
   * Checks if next page for pagination is available
   */
  nextPageAvailable(): boolean {
    if (
      this.appRef.listNext == this.appRef.matchedRecords ||
      this.appRef.matchedRecords == 0
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
      if (this.appRef.listStart - this.appRef.recordsPerPage <= 0) {
        this.appRef.listStart = 0;
        this.appRef.listNext = this.appRef.recordsPerPage;
      } else {
        this.appRef.listStart -= this.appRef.recordsPerPage;
        this.appRef.listNext =
          this.appRef.listStart + this.appRef.recordsPerPage;
      }
    }
  }

  changeRecordsPerPage(perPage: number): void {
    if (perPage > this.appRef.matchedRecords) {
      this.appRef.recordsPerPage = this.appRef.matchedRecords;
    } else {
      this.appRef.recordsPerPage = perPage;
    }
    this.appRef.listStart = 0;
    this.appRef.listNext = this.appRef.recordsPerPage;
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
      this.appRef.listStart += this.appRef.recordsPerPage;
      this.appRef.listNext += this.appRef.recordsPerPage;
      if (this.appRef.listNext > this.appRef.matchedRecords) {
        this.appRef.listNext = this.appRef.matchedRecords;
      }
    }
  }

  resultsVisible(): boolean {
    return this.appRef.listNext && this.appRef.matchedRecords ? true : false;
  }
}
