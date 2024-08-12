import {
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';

import {HsDialogComponent} from './dialog-component.interface';
import {HsDialogContainerService} from './dialog-container.service';
import {HsDialogHostDirective} from './dialog-host.directive';
import {HsDialogItem} from './dialog-item';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

@Component({
  selector: 'hs-dialog-container',
  templateUrl: './dialog-container.component.html',
  standalone: true,
  imports: [HsDialogHostDirective],
})
export class HsDialogContainerComponent implements OnInit, OnDestroy {
  @ViewChild(HsDialogHostDirective, {static: true})
  dialogHost: HsDialogHostDirective;
  interval: any;
  private destroyRef = inject(DestroyRef);
  constructor(public HsDialogContainerService: HsDialogContainerService) {}

  ngOnDestroy(): void {
    this.HsDialogContainerService.cleanup();
  }

  ngOnInit(): void {
    this.HsDialogContainerService.dialogObserver
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((item: HsDialogItem) => {
        this.loadDialog(item);
      });

    this.HsDialogContainerService.dialogDestroyObserver
      .pipe(takeUntilDestroyed(this.destroyRef))
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
      componentRef.instance as HsDialogComponent,
    );
  }
}
