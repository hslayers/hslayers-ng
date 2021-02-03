import Overlay from 'ol/Overlay';
import {Component, ElementRef} from '@angular/core';
import {HsConfirmDialogComponent} from './../../common/confirm/confirm-dialog.component';
import {HsDialogContainerService} from '../layout/dialogs/dialog-container.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsFeatureTableService} from '../feature-table/feature-table.service';
import {HsLanguageService} from './../language/language.service';
import {HsLayerUtilsService} from './../utils/layer-utils.service';
import {HsMapService} from '../map/map.service';
import {HsQueryBaseService} from './query-base.service';
import {HsQueryVectorService} from './query-vector.service';
import {getPopUp, getTitle} from '../../common/layer-extensions';
import { getFeatureTitle } from '../../common/feature-extensions';

@Component({
  selector: 'hs-query-feature-popup',
  templateUrl: './partials/feature-popup.html',
})
export class HsQueryFeaturePopupComponent {
  constructor(
    public HsQueryBaseService: HsQueryBaseService,
    public HsQueryVectorService: HsQueryVectorService,
    public HsEventBusService: HsEventBusService,
    public HsLanguageService: HsLanguageService,
    public HsLayerUtilsService: HsLayerUtilsService, //Used in template
    public HsDialogContainerService: HsDialogContainerService,
    public HsMapService: HsMapService,
    public HsFeatureTableService: HsFeatureTableService,
    ElementRef: ElementRef
  ) {
    this.HsQueryBaseService.hoverPopup = new Overlay({
      element: ElementRef.nativeElement,
    });

    this.HsEventBusService.olMapLoads.subscribe((map) => {
      map.addOverlay(this.HsQueryBaseService.hoverPopup);
    });
  }

  popupVisible() {
    const featuresWithPopup = this.HsQueryBaseService.featuresUnderMouse.filter(
      (f) => {
        const layer = this.HsMapService.getLayerForFeature(f);
        if (!layer) {
          return false;
        }
        return getPopUp(layer) != undefined;
      }
    );
    const featureCount = featuresWithPopup.length;
    return {
      'display': featureCount > 0 ? 'block' : 'none',
    };
  }
  closePopup() {
    this.HsQueryBaseService.featuresUnderMouse = [];
  }
  isClustered(feature) {
    return feature.get('features') && feature.get('features').length > 0;
  }

  serializeFeatureName(feature) {
    if (feature.get('name')) {
      return feature.get('name');
    }
    if (getFeatureTitle(feature)) {
      return getFeatureTitle(feature);
    }
    if (feature.get('label')) {
      return feature.get('label');
    }
    if (feature.get('features')) {
      return (
        'Cluster containing ' +
        feature.get('features').length +
        ' ' +
        'features'
      );
    }
    return this.HsLanguageService.getTranslation('QUERY.untitledFeature');
  }

  async removeFeature(feature) {
    const dialog = this.HsDialogContainerService.create(
      HsConfirmDialogComponent,
      {
        message: this.HsLanguageService.getTranslation('QUERY.reallyDelete'),
        title: this.HsLanguageService.getTranslation('QUERY.confirmDelete'),
      }
    );
    const confirmed = await dialog.waitResult();
    if (confirmed == 'yes') {
      this.HsQueryVectorService.removeFeature(feature);
      this.HsQueryBaseService.featuresUnderMouse = [];
    }
  }

  async clearLayer(layer) {
    const dialog = this.HsDialogContainerService.create(
      HsConfirmDialogComponent,
      {
        message: this.HsLanguageService.getTranslation(
          'QUERY.reallyDeleteAllFeaturesFrom'
        ).replace('{0}', getTitle(layer)),
        title: this.HsLanguageService.getTranslation('QUERY.confirmClear'),
      }
    );
    const confirmed = await dialog.waitResult();
    if (confirmed == 'yes') {
      if (layer.getSource().getSource) {
        //Clear clustered?
        layer.getSource().getSource().clear();
      }
      layer.getSource().clear();
      this.HsQueryBaseService.featuresUnderMouse = [];
    }
  }
}
