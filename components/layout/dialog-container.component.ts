import {Component, ComponentFactoryResolver, ViewChild} from '@angular/core';
import {HsDialogComponent} from './dialog-component.interface';
import {HsDialogContainerService} from './dialog-container.service';
import {HsDialogHostDirective} from './dialog-host.directive';
import {HsDialogItem} from './dialog-item';

@Component({
  selector: 'hs-dialog-container',
  template: require('./partials/dialog-container.html'),
})
export class HsDialogContainerComponent {
  @ViewChild(HsDialogHostDirective, {static: true})
  dialogHost: HsDialogHostDirective;
  interval: any;
  constructor(
    private HsDialogContainerService: HsDialogContainerService,
    private componentFactoryResolver: ComponentFactoryResolver
  ) {
    this.HsDialogContainerService.dialogObserver.subscribe(
      (item: HsDialogItem) => {
        this.loadDialog(item);
      }
    );
  }

  loadDialog(dialogItem) {
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(
      dialogItem.component
    );
    const viewContainerRef = this.dialogHost.viewContainerRef;
    //    viewContainerRef.clear();

    const componentRef = viewContainerRef.createComponent(componentFactory);
    (<HsDialogComponent>componentRef.instance).data = dialogItem.data;
  }
}
