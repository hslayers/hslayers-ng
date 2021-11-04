import {Component, Input, OnDestroy} from '@angular/core';

import {HsLayerWidgetContainerService} from './layer-widgets/layer-widget-container.service';
import {HsQueryPopupServiceModel} from '../query-popup.service.model';

@Component({
  selector: 'hs-query-popup-layer',
  templateUrl: './query-popup-layer.component.html',
})
export class HsQueryPopupLayerComponent implements OnDestroy {
  @Input() layerDescriptor: any;
  @Input() service: HsQueryPopupServiceModel;
  constructor(
    public hsLayerWidgetContainerService: HsLayerWidgetContainerService
  ) {}

  ngOnDestroy(): void {
    for (const panel of this.hsLayerWidgetContainerService.panels.filter(
      (panel) => panel.data?.layerDesc == this.layerDescriptor
    )) {
      this.hsLayerWidgetContainerService.destroy(panel);
    }
  }
}
