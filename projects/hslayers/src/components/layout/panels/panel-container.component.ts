import {
  Component,
  ComponentFactoryResolver,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';

import {Subscription} from 'rxjs';

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
  subscriptions: Subscription[] = [];
  constructor(
    public HsPanelContainerService: HsPanelContainerService,
    private componentFactoryResolver: ComponentFactoryResolver
  ) {}
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
  ngOnInit(): void {
    this.subscriptions.push(
      this.HsPanelContainerService.panelObserver.subscribe(
        (item: HsPanelItem) => {
          this.loadPanel(item);
        }
      )
    );
    this.subscriptions.push(
      this.HsPanelContainerService.panelDestroyObserver.subscribe(
        (item: HsPanelComponent) => {
          this.destroyPanel(item);
        }
      )
    );
  }

  destroyPanel(panel: HsPanelComponent): void {
    const viewContainerRef = this.panelHost.viewContainerRef;
    viewContainerRef.remove(viewContainerRef.indexOf(panel.viewRef));
  }

  loadPanel(panelItem: HsPanelItem): void {
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(
      panelItem.component
    );
    const viewContainerRef = this.panelHost.viewContainerRef;
    //    viewContainerRef.clear();

    const componentRef = viewContainerRef.createComponent(componentFactory);
    (<HsPanelComponent>componentRef.instance).viewRef = componentRef.hostView;
    (<HsPanelComponent>componentRef.instance).data = panelItem.data;
  }
}
