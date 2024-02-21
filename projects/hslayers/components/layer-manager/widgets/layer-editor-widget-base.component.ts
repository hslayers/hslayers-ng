import {BehaviorSubject, Subject, filter, takeUntil} from 'rxjs';
import {Component, OnDestroy, OnInit, ViewRef} from '@angular/core';

import {Layer} from 'ol/layer';

import {HsLayerDescriptor} from 'hslayers-ng/types';
import {HsLayerSelectorService} from 'hslayers-ng/shared/layer-manager';
import {HsPanelComponent} from 'hslayers-ng/common/panels';

@Component({
  template: '<div></div>',
})
export class HsLayerEditorWidgetBaseComponent
  implements HsPanelComponent, OnInit, OnDestroy {
  /**
   * This could be used to enable/disable widgets by name on HsConfig level
   */
  name: string;
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
      .pipe(
        takeUntil(this.ngBaseUnsubscribe),
        filter((layer) => !!layer),
      )
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
