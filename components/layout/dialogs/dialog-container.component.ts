import {
  Component,
  ComponentFactoryResolver,
  OnInit,
  ViewChild,
} from '@angular/core';
import {HsDialogComponent} from './dialog-component.interface';
import {HsDialogContainerService} from './dialog-container.service';
import {HsDialogHostDirective} from './dialog-host.directive';
import {HsDialogItem} from './dialog-item';

@Component({
  selector: 'hs-dialog-container',
  templateUrl: './dialog-container.html',
})
export class HsDialogContainerComponent implements OnInit {
  @ViewChild(HsDialogHostDirective, {static: true})
  dialogHost: HsDialogHostDirective;
  interval: any;
  constructor(
    private HsDialogContainerService: HsDialogContainerService,
    private componentFactoryResolver: ComponentFactoryResolver
  ) {}

  ngOnInit(): void {
    this.HsDialogContainerService.dialogObserver.subscribe(
      (item: HsDialogItem) => {
        this.loadDialog(item);
      }
    );
    this.HsDialogContainerService.dialogDestroyObserver.subscribe(
      (item: HsDialogComponent) => {
        this.destroyDialog(item);
      }
    );
  }

  destroyDialog(dialog: HsDialogComponent) {
    const viewContainerRef = this.dialogHost.viewContainerRef;
    viewContainerRef.remove(viewContainerRef.indexOf(dialog.viewRef));
  }

  loadDialog(dialogItem: HsDialogItem): void {
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(
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
