import {
  Component,
  ComponentFactoryResolver,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';

import {ReplaySubject, Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {HsConfig} from '../../../config.service';
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
  @Input() service: HsPanelContainerServiceInterface;
  /** Miscellaneous data object to set to each of the panels inside this container.
   * This is used if undefined value is passed to the create functions data parameter. */
  @Input() data: any;
  @Input() panelObserver?: ReplaySubject<HsPanelItem>;
  interval: any;
  private ngUnsubscribe = new Subject<void>();
  constructor(
    private componentFactoryResolver: ComponentFactoryResolver,
    private HsConfig: HsConfig
  ) {}
  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
  ngOnInit(): void {
    (this.panelObserver ?? this.service.panelObserver)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((item: HsPanelItem) => {
        this.loadPanel(item);
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
    const panelWidths = {
      default: 425,
      ows: 700,
      composition_browser: 550,
      addData: 700,
      mapSwipe: 550,
    };

    const componentFactory =
      this.componentFactoryResolver.resolveComponentFactory(
        panelItem.component
      );
    const viewContainerRef = this.panelHost.viewContainerRef;
    const componentRef = viewContainerRef.createComponent(componentFactory);
    const componentRefInstance = <HsPanelComponent>componentRef.instance;
    componentRefInstance.viewRef = componentRef.hostView;
    /**
     * Assign panel width class to a component host first child
     * Used to define panelSpace panel width
     */
    Object.assign(panelWidths, this.HsConfig.panelWidths);
    const panelWidth =
      panelWidths[componentRefInstance.name] || panelWidths.default;
    setTimeout(() => {
      //Without timeout componentRef.location.nativeElement could containe only placeholder <!--container--> until the real content is loaded
      componentRef.location.nativeElement.children[0].classList.add(
        `hs-panel-width-${Math.round(panelWidth / 25) * 25}`
      );
    }, 0);

    if (componentRefInstance.data == undefined) {
      componentRefInstance.data = panelItem.data || this.data;
    }
  }
}
