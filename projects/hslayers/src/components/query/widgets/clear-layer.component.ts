import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';

import {HsConfirmDialogComponent} from '../../../common/confirm/confirm-dialog.component';
import {HsDialogContainerService} from '../../layout/dialogs/dialog-container.service';
import {HsLanguageService} from '../../language/language.service';
import {HsLayerUtilsService} from '../../utils/layer-utils.service';
import {HsQueryBaseService} from '../query-base.service';
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
    public hsLayerUtilsService: HsLayerUtilsService,
    private hsDialogContainerService: HsDialogContainerService,
    private hsLanguageService: HsLanguageService,
    public hsQueryBaseService: HsQueryBaseService
  ) {
    super();
  }
  ngOnInit(): void {
    this.layerDescriptor = this.data.layerDescriptor;
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
