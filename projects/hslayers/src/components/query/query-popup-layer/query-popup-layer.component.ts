import {Component, Input} from '@angular/core';

import {HsLayerWidgetContainerService} from './layer-widgets/layer-widget-container.service';
import {HsQueryPopupServiceModel} from '../query-popup.service.model';

@Component({
  selector: 'hs-query-popup-layer',
  templateUrl: './query-popup-layer.component.html',
})
export class HsQueryPopupLayerComponent {
  @Input() layerDescriptor: any;
  @Input() service: HsQueryPopupServiceModel;
  constructor(
    public hsLayerWidgetContainerService: HsLayerWidgetContainerService
  ) {}
}
