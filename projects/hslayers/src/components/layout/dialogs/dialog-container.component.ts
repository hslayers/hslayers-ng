import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';

import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {HsDialogComponent} from './dialog-component.interface';
import {HsDialogContainerService} from './dialog-container.service';
import {HsDialogHostDirective} from './dialog-host.directive';
import {HsDialogItem} from './dialog-item';

@Component({
  selector: 'hs-dialog-container',
  templateUrl: './dialog-container.html',
})
export class HsDialogContainerComponent implements OnInit, OnDestroy {
  @ViewChild(HsDialogHostDirective, {static: true})
  dialogHost: HsDialogHostDirective;
  interval: any;
  private end = new Subject<void>();
  constructor(public HsDialogContainerService: HsDialogContainerService) {}
  ngOnDestroy(): void {
    this.end.next();
    this.end.complete();
    this.HsDialogContainerService.cleanup();
  }
  ngOnInit(): void {
    this.HsDialogContainerService.dialogObserver
      .pipe(takeUntil(this.end))
      .subscribe((item: HsDialogItem) => {
        this.loadDialog(item);
      });

    this.HsDialogContainerService.dialogDestroyObserver
      .pipe(takeUntil(this.end))
      .subscribe((item: HsDialogComponent) => {
        this.destroyDialog(item);
      });
  }

  destroyDialog(dialog: HsDialogComponent): void {
    const viewContainerRef = this.dialogHost.viewContainerRef;
    const index = viewContainerRef.indexOf(dialog.viewRef);
    if (index > -1) {
      viewContainerRef.remove(index);
    }
  }

  loadDialog(dialogItem: HsDialogItem): void {
    const viewContainerRef = this.dialogHost.viewContainerRef;
    //    viewContainerRef.clear();
    const componentRef = viewContainerRef.createComponent(dialogItem.component);
    (<HsDialogComponent>componentRef.instance).viewRef = componentRef.hostView;
    (<HsDialogComponent>componentRef.instance).data = dialogItem.data;
    (<HsDialogComponent>componentRef.instance).dialogItem = dialogItem;
    this.HsDialogContainerService.dialogs.push(
      componentRef.instance as HsDialogComponent
    );
  }
}
