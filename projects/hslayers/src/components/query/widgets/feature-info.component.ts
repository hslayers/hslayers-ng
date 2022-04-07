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
    app: string;
    service: HsQueryPopupServiceModel;
  };

  constructor(
    private hsLanguageService: HsLanguageService,
    private hsQueryVectorService: HsQueryVectorService,
    private hsDialogContainerService: HsDialogContainerService
  ) {
    super();
  }
  ngOnInit(): void {
    this.layerDescriptor = this.data.layerDescriptor;
    this.attributesForHover = this.data.attributesForHover;
  }

  /**
   * Serialize feature name
   * @param feature - Feature selected
   * @returns Serialized feature name
   */
  serializeFeatureName(feature: Feature<Geometry>): string {
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
      return this.hsLanguageService.getTranslation(
        'QUERY.clusterContaining',
        {
          count: getFeatures(feature).length,
        },
        this.data.app
      );
    }
    return this.hsLanguageService.getTranslation(
      'QUERY.untitledFeature',
      undefined,
      this.data.app
    );
  }

  /**
   * Remove feature
   * @param feature - Feature selected
   */
  async removeFeature(feature: Feature<Geometry>): Promise<void> {
    const dialog = this.hsDialogContainerService.create(
      HsConfirmDialogComponent,
      {
        message: this.hsLanguageService.getTranslation(
          'QUERY.reallyDelete',
          undefined,
          this.data.app
        ),
        title: this.hsLanguageService.getTranslation(
          'QUERY.confirmDelete',
          undefined,
          this.data.app
        ),
      },
      this.data.app
    );
    const confirmed = await dialog.waitResult();
    if (confirmed == 'yes') {
      this.hsQueryVectorService.removeFeature(feature, this.data.app);
      this.data.service.apps[this.data.app].featuresUnderMouse = [];
    }
  }

  /**
   * Check if feature is a cluster
   * @param feature - Feature selected
   * @returns True or false
   */
  isClustered(feature: Feature<Geometry>): boolean {
    return getFeatures(feature) && getFeatures(feature).length > 0;
  }

  /**
   * Check if feature has sub-features
   * @param feature - Feature selected
   * @returns True or false
   */
  hasMultipleSubFeatures(feature: Feature<Geometry>): boolean {
    return getFeatures(feature).length > 1;
  }

  /**
   * Check if feature is removable
   * @param feature - Feature selected
   * @returns True or false
   */
  isFeatureRemovable(feature: Feature<Geometry>): boolean {
    return this.hsQueryVectorService.isFeatureRemovable(feature, this.data.app);
  }

  /**
   * Translate string value to the selected UI language
   * @param module - Locales json key
   * @param text - Locales json key value
   * @returns Translated text
   */
  translateString(module: string, text: string): string {
    return this.hsLanguageService.getTranslationIgnoreNonExisting(
      module,
      text,
      undefined,
      this.data.app
    );
  }
}
