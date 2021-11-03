import {AfterContentInit, Component, Input, OnDestroy} from '@angular/core';

import {HsQueryPopupServiceModel} from '../query-popup.service.model';

import {HsClearLayerComponent} from './layer-widgets/clear-layer.component';
import {HsLayerWidgetContainerService} from './layer-widgets/layer-widget-container.service';

@Component({
  selector: 'hs-feature-popup-layer',
  templateUrl: './feature-popup-layer.component.html',
})
export class HsFeaturePopupLayerComponent
  implements AfterContentInit, OnDestroy {
  @Input() layerDescriptor: any;
  @Input() service: HsQueryPopupServiceModel;
  constructor(
    public hsLayerWidgetContainerService: HsLayerWidgetContainerService
  ) {}

  ngAfterContentInit(): void {
    this.hsLayerWidgetContainerService.createWithOwner(
      this,
      HsClearLayerComponent,
      {
        layerDesc: this.layerDescriptor,
        service: this.service,
      }
    );
  }

  ngOnDestroy(): void {
    for (const panel of this.hsLayerWidgetContainerService.panels.filter(
      (panel) => panel.data?.layerDesc == this.layerDescriptor
    )) {
      this.hsLayerWidgetContainerService.destroy(panel);
    }
  }
}
