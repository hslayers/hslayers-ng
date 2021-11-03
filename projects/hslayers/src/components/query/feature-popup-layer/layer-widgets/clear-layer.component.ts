import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';

import {HsConfirmDialogComponent} from '../../../../common/confirm/confirm-dialog.component';
import {HsDialogContainerService} from '../../../layout/dialogs/dialog-container.service';
import {HsFeaturePopupWidgetBaseComponent} from '../../feature-popup-widget-base.component';
import {HsLanguageService} from '../../../language/language.service';
import {HsLayerUtilsService} from '../../../utils/layer-utils.service';
import {HsLayerWidgetContainerService} from './layer-widget-container.service';
import {HsQueryBaseService} from '../../query-base.service';
import {HsQueryPopupServiceModel} from '../../query-popup.service.model';
import {getTitle} from '../../../../common/layer-extensions';

@Component({
  selector: 'hs-clear-layer',
  templateUrl: './clear-layer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HsClearLayerComponent
  extends HsFeaturePopupWidgetBaseComponent
  implements OnInit {
  @Input() data: {
    layerDesc: any;
    service: HsQueryPopupServiceModel;
  };

  layerDesc: any;
  constructor(
    public hsLayerUtilsService: HsLayerUtilsService,
    private hsDialogContainerService: HsDialogContainerService,
    private hsLanguageService: HsLanguageService,
    public hsQueryBaseService: HsQueryBaseService,
    public hsLayerWidgetContainerService: HsLayerWidgetContainerService
  ) {
    super();
  }
  ngOnInit(): void {
    this.layerDesc = this.data.layerDesc;
  }

  async clearLayer(layer): Promise<void> {
    const dialog = this.hsDialogContainerService.create(
      HsConfirmDialogComponent,
      {
        message: this.hsLanguageService
          .getTranslation('QUERY.reallyDeleteAllFeaturesFrom')
          .replace('{0}', getTitle(layer)),
        title: this.hsLanguageService.getTranslation('QUERY.confirmClear'),
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
}
