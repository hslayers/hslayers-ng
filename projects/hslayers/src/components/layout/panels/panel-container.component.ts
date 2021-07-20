import {
  Component,
  ComponentFactoryResolver,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';

import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {HsPanelComponent} from './panel-component.interface';
import {HsPanelContainerService} from './panel-container.service';
import {HsPanelHostDirective} from './panel-host.directive';
import {HsPanelItem} from './panel-item';

@Component({
  selector: 'hs-panel-container',
  templateUrl: './panel-container.html',
})
export class HsPanelContainerComponent implements OnInit, OnDestroy {
  @ViewChild(HsPanelHostDirective, {static: true})
  panelHost: HsPanelHostDirective;
  interval: any;
  private ngUnsubscribe = new Subject();
  constructor(
    public HsPanelContainerService: HsPanelContainerService,
    private componentFactoryResolver: ComponentFactoryResolver
  ) {}
  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
  ngOnInit(): void {
    this.HsPanelContainerService.panelObserver
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((item: HsPanelItem) => {
        this.loadPanel(item);
      });
    this.HsPanelContainerService.panelDestroyObserver
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((item: HsPanelComponent) => {
        this.destroyPanel(item);
      });
  }

  destroyPanel(panel: HsPanelComponent): void {
    const viewContainerRef = this.panelHost.viewContainerRef;
    viewContainerRef.remove(viewContainerRef.indexOf(panel.viewRef));
  }

  loadPanel(panelItem: HsPanelItem): void {
    const componentFactory =
      this.componentFactoryResolver.resolveComponentFactory(
        panelItem.component
      );
    const viewContainerRef = this.panelHost.viewContainerRef;
    //    viewContainerRef.clear();

    const componentRef = viewContainerRef.createComponent(componentFactory);
    (<HsPanelComponent>componentRef.instance).viewRef = componentRef.hostView;
    (<HsPanelComponent>componentRef.instance).data = panelItem.data;
  }
}
