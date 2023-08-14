import {Component, OnDestroy, OnInit, ViewRef} from '@angular/core';

import {Layer} from 'ol/layer';

import {BehaviorSubject, Subject, takeUntil} from 'rxjs';
import {HsLayerDescriptor} from '../layer-descriptor.interface';
import {HsLayerSelectorService} from '../editor/layer-selector.service';
import {HsPanelComponent} from '../../layout/panels/panel-component.interface';
@Component({
  template: '<div></div>',
})
export class HsLayerEditorWidgetBaseComponent
  implements HsPanelComponent, OnInit, OnDestroy {
  name: string; //This could be used to enable/disable widgets by name on HsConfig level
  viewRef: ViewRef;
  data: any;
  layerDescriptor = new BehaviorSubject<HsLayerDescriptor>(null);
  olLayer: Layer;
  isVisible$ = new BehaviorSubject<boolean>(true);

  private ngBaseUnsubscribe = new Subject<void>();
  constructor(public hsLayerSelectorService: HsLayerSelectorService) {
    this.layerDescriptor.subscribe((descriptor) => {
      this.olLayer = descriptor?.layer;
    });
  }
  ngOnInit() {
    this.layerDescriptor.next(this.hsLayerSelectorService.currentLayer);

    this.hsLayerSelectorService.layerSelected
      .pipe(takeUntil(this.ngBaseUnsubscribe))
      .subscribe((layer) => {
        this.layerDescriptor.next(layer);
      });
  }
  isVisible(): boolean {
    return true;
  }

  ngOnDestroy(): void {
    this.ngBaseUnsubscribe.next();
    this.ngBaseUnsubscribe.complete();
  }
}
