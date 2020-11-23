import {
  Component,
  ComponentFactoryResolver,
  OnInit,
  ViewChild,
} from '@angular/core';
import {HsPanelComponent} from './panel-component.interface';
import {HsPanelContainerService} from './panel-container.service';
import {HsPanelHostDirective} from './panel-host.directive';
import {HsPanelItem} from './panel-item';

@Component({
  selector: 'hs-panel-container',
  template: require('./panel-container.html'),
})
export class HsPanelContainerComponent implements OnInit {
  @ViewChild(HsPanelHostDirective, {static: true})
  panelHost: HsPanelHostDirective;
  interval: any;
  constructor(
    public HsPanelContainerService: HsPanelContainerService,
    private componentFactoryResolver: ComponentFactoryResolver
  ) {}

  ngOnInit(): void {
    this.HsPanelContainerService.panelObserver.subscribe(
      (item: HsPanelItem) => {
        this.loadPanel(item);
      }
    );
    this.HsPanelContainerService.panelDestroyObserver.subscribe(
      (item: HsPanelComponent) => {
        this.destroyPanel(item);
      }
    );
  }

  destroyPanel(panel: HsPanelComponent) {
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
