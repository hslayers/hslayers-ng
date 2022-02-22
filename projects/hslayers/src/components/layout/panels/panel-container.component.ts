import {
  Component,
  ComponentFactoryResolver,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
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
  @Input() app = 'default';
  /**
   * Set this to true to not clear the ReplaySubject on container destruction because
   * panels are added to ReplaySubject from app component and we cant re-add them. */
  @Input() reusePanelObserver?: boolean;
  @Input() panelObserver?: ReplaySubject<HsPanelItem>;
  @Output() init = new EventEmitter<void>();
  interval: any;
  private ngUnsubscribe = new Subject<void>();
  constructor(
    private componentFactoryResolver: ComponentFactoryResolver,
    private HsConfig: HsConfig
  ) {}
  ngOnDestroy(): void {
    if (this.service.panelObserver && this.reusePanelObserver !== true) {
      this.service.panelObserver.complete();
      this.service.panelObserver = new ReplaySubject<HsPanelItem>();
    }
    for (const p of this.service.panels) {
      if (p.cleanup) {
        p.cleanup();
      }
      this.service.destroy(p);
    }
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
  ngOnInit(): void {
    this.service.panels = [];
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
    this.init.emit();
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
    /**
     * Assign panel width class to a component host first child
     * Used to define panelSpace panel width
     */
    this.service.setPanelWidth(
      this.HsConfig.get(this.app).panelWidths,
      componentRefInstance
    );

    if (componentRefInstance.data == undefined) {
      componentRefInstance.data = panelItem.data || this.data;
    }
    this.service.panels.push(componentRef.instance as HsPanelComponent);
  }
}
