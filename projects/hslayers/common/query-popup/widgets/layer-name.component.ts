import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';

import {HsLayerDescriptor} from 'hslayers-ng/types';
import {HsLayerUtilsService} from 'hslayers-ng/services/utils';
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

  constructor(private hsLayerUtilsService: HsLayerUtilsService) {
    super();
  }

  ngOnInit(): void {
    this.layerDescriptor = this.data.layerDescriptor;
  }

  /**
   * Get title translation
   * @param title - Title to translate
   * @returns Translated title
   */
  translateTitle(title: string): string {
    return this.hsLayerUtilsService.translateTitle(title);
  }
}
