import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';

import {Feature} from 'ol';
import {Geometry} from 'ol/geom';

import {HsConfirmDialogComponent} from '../../../common/confirm/confirm-dialog.component';
import {HsDialogContainerService} from '../../layout/dialogs/dialog-container.service';
import {HsLanguageService} from '../../language/language.service';
import {HsQueryPopupServiceModel} from '../query-popup.service.model';
import {HsQueryPopupWidgetBaseComponent} from '../query-popup-widget-base.component';
import {HsQueryVectorService} from '../query-vector.service';
import {
  getFeatureLabel,
  getFeatureName,
  getFeatureTitle,
  getFeatures,
} from '../../../common/feature-extensions';

@Component({
  selector: 'hs-feature-info',
  templateUrl: './feature-info.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HsFeatureInfoComponent
  extends HsQueryPopupWidgetBaseComponent
  implements OnInit
{
  layerDescriptor: any;
  attributesForHover: any[] = [];
  name = 'feature-info';
  @Input() data: {
    layerDescriptor: any;
    attributesForHover: any[];
    service: HsQueryPopupServiceModel;
  };

  constructor(
    public hsLanguageService: HsLanguageService,
    public hsQueryVectorService: HsQueryVectorService,
    private hsDialogContainerService: HsDialogContainerService
  ) {
    super();
  }
  ngOnInit(): void {
    this.layerDescriptor = this.data.layerDescriptor;
    this.attributesForHover = this.data.attributesForHover;
  }

  serializeFeatureName(feature): string {
    if (!feature) {
      return;
    }
    if (getFeatureName(feature)) {
      return getFeatureName(feature);
    }
    if (getFeatureTitle(feature)) {
      return getFeatureTitle(feature);
    }
    if (getFeatureLabel(feature)) {
      return getFeatureLabel(feature);
    }
    if (getFeatures(feature)) {
      return this.hsLanguageService.getTranslation('QUERY.clusterContaining', {
        count: getFeatures(feature).length,
      });
    }
    return this.hsLanguageService.getTranslation('QUERY.untitledFeature');
  }

  async removeFeature(feature): Promise<void> {
    const dialog = this.hsDialogContainerService.create(
      HsConfirmDialogComponent,
      {
        message: this.hsLanguageService.getTranslation('QUERY.reallyDelete'),
        title: this.hsLanguageService.getTranslation('QUERY.confirmDelete'),
      }
    );
    const confirmed = await dialog.waitResult();
    if (confirmed == 'yes') {
      this.hsQueryVectorService.removeFeature(feature);
      this.data.service.featuresUnderMouse = [];
    }
  }

  isClustered(feature): boolean {
    return getFeatures(feature) && getFeatures(feature).length > 0;
  }

  hasMultipleSubFeatures(feature): boolean {
    return getFeatures(feature).length > 1;
  }
}
