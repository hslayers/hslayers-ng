import {AfterContentInit, Component, Input} from '@angular/core';

import {HsClearLayerComponent} from './layer-widgets/clear-layer.component';
import {HsLayerWidgetContainerService} from './layer-widgets/layer-widget-container.service';

@Component({
  selector: 'hs-feature-popup-layer',
  templateUrl: './feature-popup-layer.component.html',
})
export class HsFeaturePopupLayerComponent implements AfterContentInit {
  @Input() layerDescriptor: any;
  constructor(
    public hsLayerWidgetContainerService: HsLayerWidgetContainerService
  ) {}

  ngAfterContentInit(): void {
    this.hsLayerWidgetContainerService.create(HsClearLayerComponent, {
      layerDesc: this.layerDescriptor,
    });
  }
}
