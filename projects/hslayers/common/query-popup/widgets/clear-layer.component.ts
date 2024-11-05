import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';

import {Layer} from 'ol/layer';
import {Source} from 'ol/source';

import {HsConfirmDialogComponent} from 'hslayers-ng/common/confirm';
import {HsDialogContainerService} from 'hslayers-ng/common/dialogs';
import {HsLanguageService} from 'hslayers-ng/services/language';
import {HsLayerUtilsService} from 'hslayers-ng/services/utils';
import {HsQueryPopupServiceModel} from '..//query-popup.service.model';
import {HsQueryPopupWidgetBaseComponent} from '..//query-popup-widget-base.component';
import {getTitle} from 'hslayers-ng/common/extensions';

@Component({
  selector: 'hs-clear-layer',
  templateUrl: './clear-layer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HsClearLayerComponent
  extends HsQueryPopupWidgetBaseComponent
  implements OnInit {
  @Input() data: {
    layerDescriptor: any;
    service: HsQueryPopupServiceModel;
  };
  name = 'clear-layer';
  layerDescriptor: any;
  constructor(
    private hsLayerUtilsService: HsLayerUtilsService,
    private hsDialogContainerService: HsDialogContainerService,
    private hsLanguageService: HsLanguageService,
  ) {
    super();
  }
  ngOnInit(): void {
    this.layerDescriptor = this.data.layerDescriptor;
  }

  /**
   * Clear all layer source
   * @param layer - Layer selected
   */
  async clearLayer(layer): Promise<void> {
    const dialog = this.hsDialogContainerService.create(
      HsConfirmDialogComponent,
      {
        message: this.hsLanguageService
          .getTranslation('QUERY.reallyDeleteAllFeaturesFrom', undefined)
          .replace('{0}', getTitle(layer)),
        title: 'QUERY.confirmClear',
      },
    );
    const confirmed = await dialog.waitResult();
    if (confirmed == 'yes') {
      if (layer.getSource().getSource) {
        //Clear clustered?
        layer.getSource().getSource().clear();
      }
      layer.getSource().clear();
      this.data.service.featuresUnderMouse = [];
      this.data.service.featureLayersUnderMouse = [];
    }
  }

  /**
   * Check if layer is editable
   * @param layer - Layer selected
   * @returns True if the layer is editable, false otherwise
   */
  isLayerEditable(layer: Layer<Source>): boolean {
    return this.hsLayerUtilsService.isLayerEditable(layer);
  }
}
