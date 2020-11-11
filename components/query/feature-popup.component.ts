import Overlay from 'ol/Overlay';
import {Component, ElementRef} from '@angular/core';
import {HsConfirmDialogComponent} from './../../common/confirm/confirm-dialog.component';
import {HsDialogContainerService} from '../layout/dialogs/dialog-container.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLayerUtilsService} from './../utils/layer-utils.service';
import {HsMapService} from '../map/map.service';
import {HsQueryBaseService} from './query-base.service';
import {HsQueryVectorService} from './query-vector.service';
import {TranslateService} from '@ngx-translate/core';

@Component({
  selector: 'hs-query-feature-popup',
  template: require('./partials/feature-popup.html'),
})
export class HsQueryFeaturePopupComponent {
  constructor(
    private HsQueryBaseService: HsQueryBaseService,
    private HsQueryVectorService: HsQueryVectorService,
    private HsEventBusService: HsEventBusService,
    private TranslateService: TranslateService,
    private HsLayerUtilsService: HsLayerUtilsService,
    private HsDialogContainerService: HsDialogContainerService,
    private HsMapService: HsMapService,
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
        return layer.get('popUp') != undefined;
      }
    );
    const featureCount = featuresWithPopup.length;
    return {
      'display': featureCount > 0 ? 'block' : 'none',
    };
  }
  closePopup() {
    this.HsQueryBaseService.featuresUnderMouse = [];
    this.popupVisible();
  }
  isClustered(feature) {
    return feature.get('features') && feature.get('features').length > 0;
  }

  serializeFeatureName(feature) {
    if (feature.get('name')) {
      return feature.get('name');
    }
    if (feature.get('title')) {
      return feature.get('title');
    }
    if (feature.get('label')) {
      return feature.get('label');
    }
    if(feature.get('features')){
      return 'Cluster containing ' + feature.get('features').length + ' ' + 'features';
    }
  }

  async removeFeature(feature) {
    const dialog = this.HsDialogContainerService.create(
      HsConfirmDialogComponent,
      {
        message: this.TranslateService.instant('Really delete this feature?'),
        title: this.TranslateService.instant('Confirm delete'),
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
        message: this.TranslateService.instant(
          'Really delete all features from layer "{0}"?'
        ).replace('{0}', layer.get('title')),
        title: this.TranslateService.instant('Confirm clear'),
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
