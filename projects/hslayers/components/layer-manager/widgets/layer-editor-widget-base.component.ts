import {BehaviorSubject, filter} from 'rxjs';
import {Component, DestroyRef, OnInit, ViewRef, inject} from '@angular/core';

import {Layer} from 'ol/layer';

import {HsLayerDescriptor} from 'hslayers-ng/types';
import {HsLayerSelectorService} from 'hslayers-ng/services/layer-manager';
import {HsPanelComponent} from 'hslayers-ng/common/panels';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

@Component({
  template: '<div></div>',
  standalone: false,
})
export class HsLayerEditorWidgetBaseComponent
  implements HsPanelComponent, OnInit
{
  /**
   * This could be used to enable/disable widgets by name on HsConfig level
   */
  name: string;
  viewRef: ViewRef;
  data: any;
  layerDescriptor = new BehaviorSubject<HsLayerDescriptor>(null);
  olLayer: Layer;
  isVisible$ = new BehaviorSubject<boolean>(true);

  baseComponentInitRun = false;
  destroyRef = inject(DestroyRef);

  constructor(public hsLayerSelectorService: HsLayerSelectorService) {
    this.layerDescriptor.subscribe((descriptor) => {
      this.olLayer = descriptor?.layer;
    });

    setTimeout(() => {
      if (!this.baseComponentInitRun) {
        console.warn(
          `${
            this.name || this.constructor.name
          } implements ngOnInit lifecycle hook without calling HsLayerEditorWidgetBaseComponent ngOnInit. 
          Make sure it is executed by calling super.ngOnInit() from component's ngOnInit manually`,
        );
      }
    }, 3000);
  }

  ngOnInit() {
    this.baseComponentInitRun = true;
    this.layerDescriptor.next(this.hsLayerSelectorService.currentLayer);

    this.hsLayerSelectorService.layerSelected
      .pipe(
        filter((layer) => !!layer),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((layer) => {
        this.layerDescriptor.next(layer);
      });
  }

  isVisible(): boolean {
    return true;
  }
}
