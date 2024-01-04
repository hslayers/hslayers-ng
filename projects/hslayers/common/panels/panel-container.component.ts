import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';

import {ReplaySubject, Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {HsConfig} from 'hslayers-ng/config';
import {HsLogService} from 'hslayers-ng/shared/log';
import {HsPanelComponent} from './panel-component.interface';
import {HsPanelContainerServiceInterface} from 'hslayers-ng/shared/layout';
import {HsPanelHostDirective} from './panel-host.directive';
import {HsPanelItem} from './panel-item';

@Component({
  selector: 'hs-panel-container',
  templateUrl: './panel-container.component.html',
})
export class HsPanelContainerComponent implements OnInit, OnDestroy {
  @ViewChild(HsPanelHostDirective, {static: true})
  panelHost: HsPanelHostDirective;
  /** Service which manages the list of panels
   */
  @Input() service: HsPanelContainerServiceInterface;
  /** Miscellaneous data object to set to each of the panels inside this container.
   * This is used if undefined value is passed to the create functions data parameter.
   */
  @Input() data: any;
  /**
   * Set this to true to not clear the ReplaySubject on container destruction because
   * panels are added to ReplaySubject from app component and we cant re-add them.
   */
  @Input() reusePanelObserver?: boolean;
  @Input() panelObserver?: ReplaySubject<HsPanelItem>;
  @Output() init = new EventEmitter<void>();
  interval: any;
  private end = new Subject<void>();
  constructor(
    private hsConfig: HsConfig,
    private hsLog: HsLogService,
  ) {}

  ngOnDestroy(): void {
    if (this.service.panelObserver && this.reusePanelObserver !== true) {
      this.service.panelObserver.complete();
      this.service.panelObserver = new ReplaySubject<HsPanelItem>();
    }
    for (const p of this.service.panels) {
      this.service.destroy(p);
    }
    this.end.next();
    this.end.complete();
  }

  ngOnInit(): void {
    this.service.panels = [];
    (this.panelObserver ?? this.service.panelObserver)
      .pipe(takeUntil(this.end))
      .subscribe((item: HsPanelItem) => {
        this.loadPanel(item);
      });
    this.service.panelDestroyObserver
      .pipe(takeUntil(this.end))
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
    const viewContainerRef = this.panelHost.viewContainerRef;
    const componentRef = viewContainerRef.createComponent(panelItem.component);
    const componentRefInstance = <HsPanelComponent>componentRef.instance;
    componentRefInstance.viewRef = componentRef.hostView;

    /* When component doesn't create its own data object 
    set data by merging two sources: html attribute (this.data) and parameter passed 
    to PanelContainerService.create function (panelItem.data). It can contain 
    layerDescriptor for example */
    if (componentRefInstance.data == undefined) {
      Object.assign(panelItem.data, this.data);
      componentRefInstance.data = panelItem.data;
    }
    this.service.panels.push(componentRefInstance);
    if (!componentRefInstance.isVisible$) {
      this.hsLog.warn(
        componentRefInstance,
        'should extend HsPanelBaseComponent',
      );
    }
  }
}
