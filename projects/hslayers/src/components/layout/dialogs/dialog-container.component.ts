import {
  Component,
  ComponentFactoryResolver,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';

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
  private ngUnsubscribe = new Subject<void>();
  constructor(
    public HsDialogContainerService: HsDialogContainerService,
    private componentFactoryResolver: ComponentFactoryResolver
  ) {}
  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
  ngOnInit(): void {
    this.HsDialogContainerService.dialogObserver
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((item: HsDialogItem) => {
        this.loadDialog(item);
      });

    this.HsDialogContainerService.dialogDestroyObserver
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((item: HsDialogComponent) => {
        this.destroyDialog(item);
      });
  }

  destroyDialog(dialog: HsDialogComponent): void {
    const viewContainerRef = this.dialogHost.viewContainerRef;
    viewContainerRef.remove(viewContainerRef.indexOf(dialog.viewRef));
  }

  loadDialog(dialogItem: HsDialogItem): void {
    const componentFactory =
      this.componentFactoryResolver.resolveComponentFactory(
        dialogItem.component
      );
    const viewContainerRef = this.dialogHost.viewContainerRef;
    //    viewContainerRef.clear();

    const componentRef = viewContainerRef.createComponent(componentFactory);
    (<HsDialogComponent>componentRef.instance).viewRef = componentRef.hostView;
    (<HsDialogComponent>componentRef.instance).data = dialogItem.data;
    (<HsDialogComponent>componentRef.instance).dialogItem = dialogItem;
  }
}
