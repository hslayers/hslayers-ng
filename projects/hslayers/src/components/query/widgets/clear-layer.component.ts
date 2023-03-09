import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';

import {Layer} from 'ol/layer';
import {Source} from 'ol/source';

import {HsConfirmDialogComponent} from '../../../common/confirm/confirm-dialog.component';
import {HsDialogContainerService} from '../../layout/dialogs/dialog-container.service';
import {HsLanguageService} from '../../language/language.service';
import {HsLayerUtilsService} from '../../utils/layer-utils.service';
import {HsQueryPopupServiceModel} from '../query-popup.service.model';
import {HsQueryPopupWidgetBaseComponent} from '../query-popup-widget-base.component';
import {getTitle} from '../../../common/layer-extensions';

@Component({
  selector: 'hs-clear-layer',
  templateUrl: './clear-layer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HsClearLayerComponent
  extends HsQueryPopupWidgetBaseComponent
  implements OnInit
{
  @Input() data: {
    layerDescriptor: any;
    service: HsQueryPopupServiceModel;
  };
  name = 'clear-layer';
  layerDescriptor: any;
  constructor(
    private hsLayerUtilsService: HsLayerUtilsService,
    private hsDialogContainerService: HsDialogContainerService,
    private hsLanguageService: HsLanguageService
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
        title: this.hsLanguageService.getTranslation(
          'QUERY.confirmClear',
          undefined
        ),
      }
    );
    const confirmed = await dialog.waitResult();
    if (confirmed == 'yes') {
      if (layer.getSource().getSource) {
        //Clear clustered?
        layer.getSource().getSource().clear();
      }
      layer.getSource().clear();
      this.data.service.featuresUnderMouse = [];
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
