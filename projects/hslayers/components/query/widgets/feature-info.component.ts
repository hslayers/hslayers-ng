import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';

import {Feature} from 'ol';
import {Geometry} from 'ol/geom';

import {HsConfirmDialogComponent} from 'hslayers-ng/common/confirm';
import {HsDialogContainerService} from 'hslayers-ng/components/layout';
import {HsLanguageService} from 'hslayers-ng/components/language';
import {HsLayerDescriptor} from 'hslayers-ng/components/layer-manager';
import {HsQueryPopupServiceModel} from '../query-popup.service.model';
import {HsQueryPopupWidgetBaseComponent} from '../query-popup-widget-base.component';
import {HsQueryVectorService} from '../query-vector.service';
import {
  getFeatureLabel,
  getFeatureName,
  getFeatureTitle,
  getFeatures,
} from 'hslayers-ng/common/extensions';

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
    layerDescriptor: HsLayerDescriptor;
    attributesForHover: any[];
    service: HsQueryPopupServiceModel;
  };

  constructor(
    private hsLanguageService: HsLanguageService,
    private hsQueryVectorService: HsQueryVectorService,
    private hsDialogContainerService: HsDialogContainerService,
  ) {
    super();
  }
  ngOnInit(): void {
    this.layerDescriptor = this.data.layerDescriptor;
    this.attributesForHover = this.data.attributesForHover;
  }

  /**
   * Serialize feature name. Searches for 'title', 'name' and 'label' properties. If the feature is a cluster, a description of the cluster is returned instead.
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
      return this.hsLanguageService.getTranslation('QUERY.clusterContaining', {
        count: getFeatures(feature).length,
      });
    }
    return this.hsLanguageService.getTranslation(
      'QUERY.untitledFeature',
      undefined,
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
        ),
        title: this.hsLanguageService.getTranslation(
          'QUERY.confirmDelete',
          undefined,
        ),
      },
    );
    const confirmed = await dialog.waitResult();
    if (confirmed == 'yes') {
      this.hsQueryVectorService.removeFeature(feature);
      this.data.service.featuresUnderMouse = [];
    }
  }

  /**
   * Check if feature is a cluster
   * @param feature - Feature selected
   * @returns True if the feature is a cluster, false otherwise
   */
  isClustered(feature: Feature<Geometry>): boolean {
    return getFeatures(feature) && getFeatures(feature).length > 0;
  }

  /**
   * Check if feature has sub-features
   * @param feature - Feature selected
   * @returns True if this cluster has more than 1 sub-feature, false otherwise
   */
  hasMultipleSubFeatures(feature: Feature<Geometry>): boolean {
    return getFeatures(feature).length > 1;
  }

  /**
   * Check if feature is removable
   * @param feature - Feature selected
   * @returns True if the feature is removable, false otherwise
   */
  isFeatureRemovable(feature: Feature<Geometry>): boolean {
    return this.hsQueryVectorService.isFeatureRemovable(feature);
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
    );
  }
}
