import {
  Component,
  ComponentFactoryResolver,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';

import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {HsPanelComponent} from './panel-component.interface';
import {HsPanelContainerServiceInterface} from './panel-container.service.interface';
import {HsPanelHostDirective} from './panel-host.directive';
import {HsPanelItem} from './panel-item';

@Component({
  selector: 'hs-panel-container',
  templateUrl: './panel-container.html',
})
export class HsPanelContainerComponent implements OnInit, OnDestroy {
  @ViewChild(HsPanelHostDirective, {static: true})
  panelHost: HsPanelHostDirective;
  /** Service which manages the list of panels */
  @Input()
  service: HsPanelContainerServiceInterface;
  @Input()
  ownerComponent?: any;
  interval: any;
  private ngUnsubscribe = new Subject();
  constructor(private componentFactoryResolver: ComponentFactoryResolver) {}
  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
  ngOnInit(): void {
    this.service.panelObserver
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((item: HsPanelItem) => {
        if (
          item.ownerComponent == undefined ||
          this.ownerComponent == item.ownerComponent
        ) {
          this.loadPanel(item);
        }
      });
    this.service.panelDestroyObserver
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((item: HsPanelComponent) => {
        this.destroyPanel(item);
      });
  }

  destroyPanel(panel: HsPanelComponent): void {
    const viewContainerRef = this.panelHost.viewContainerRef;
    const index = viewContainerRef.indexOf(panel.viewRef);
    if (index > -1) {
      viewContainerRef.remove(index);
    }
  }

  loadPanel(panelItem: HsPanelItem): void {
    const componentFactory =
      this.componentFactoryResolver.resolveComponentFactory(
        panelItem.component
      );
    const viewContainerRef = this.panelHost.viewContainerRef;
    const componentRef = viewContainerRef.createComponent(componentFactory);
    const componentRefInstance = <HsPanelComponent>componentRef.instance;
    componentRefInstance.viewRef = componentRef.hostView;
    componentRefInstance.data = panelItem.data;
    this.service.panels.push(componentRefInstance);
  }
}
