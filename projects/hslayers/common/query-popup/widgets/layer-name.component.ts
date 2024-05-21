import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';

import {HsLayerDescriptor} from 'hslayers-ng/types';
import {HsQueryPopupWidgetBaseComponent} from '../query-popup-widget-base.component';

@Component({
  selector: 'hs-layer-name',
  templateUrl: './layer-name.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HsLayerNameComponent
  extends HsQueryPopupWidgetBaseComponent
  implements OnInit
{
  layerDescriptor: any;
  name = 'layer-name';

  @Input() data: {
    layerDescriptor: HsLayerDescriptor;
  };

  constructor() {
    super();
  }

  ngOnInit(): void {
    this.layerDescriptor = this.data.layerDescriptor;
  }
}
