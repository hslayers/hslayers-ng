import {Component, ElementRef, OnDestroy, ViewRef} from '@angular/core';

import {HsDialogComponent, HsDialogContainerService} from 'hslayers-ng';

import {Subject} from 'rxjs';

@Component({
  selector: 'info',
  templateUrl: './info-dialog.component.html',
})
export class InfoDialogComponent implements HsDialogComponent, OnDestroy {
  private end = new Subject<void>();
  viewRef: ViewRef;
  data: any;

  constructor(
    private hsDialogContainerService: HsDialogContainerService,
    public elementRef: ElementRef
  ) {}

  close(): void {
    this.hsDialogContainerService.destroy(this, this.data.app);
  }

  ngOnDestroy(): void {
    this.end.next();
    this.end.complete();
  }
}
