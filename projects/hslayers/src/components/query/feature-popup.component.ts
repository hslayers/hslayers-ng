import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewRef,
} from '@angular/core';

import Overlay from 'ol/Overlay';
import {Subscription} from 'rxjs';

import {HsConfirmDialogComponent} from './../../common/confirm/confirm-dialog.component';
import {HsDialogComponent} from '../layout/dialogs/dialog-component.interface';
import {HsDialogContainerService} from '../layout/dialogs/dialog-container.service';
import {HsDialogItem} from '../layout/dialogs/dialog-item';
import {HsEventBusService} from '../core/event-bus.service';
import {HsFeatureTableService} from '../feature-table/feature-table.service';
import {HsLanguageService} from './../language/language.service';
import {HsLayerUtilsService} from './../utils/layer-utils.service';
import {HsMapService} from '../map/map.service';
import {HsQueryBaseService} from './query-base.service';
import {HsQueryVectorService} from './query-vector.service';
import {
  getFeatureLabel,
  getFeatureName,
  getFeatureTitle,
  getFeatures,
} from '../../common/feature-extensions';
import {getPopUp, getTitle} from '../../common/layer-extensions';

@Component({
  selector: 'hs-query-feature-popup',
  templateUrl: './partials/feature-popup.html',
})
export class HsQueryFeaturePopupComponent
  implements OnDestroy, HsDialogComponent, AfterViewInit
{
  getFeatures = getFeatures;
  olMapLoadsSubscription: Subscription;
  attributesForHover = [];
  dialogItem?: HsDialogItem;
  viewRef: ViewRef;
  data: any;

  constructor(
    public HsQueryBaseService: HsQueryBaseService,
    public HsQueryVectorService: HsQueryVectorService,
    public HsEventBusService: HsEventBusService,
    public HsLanguageService: HsLanguageService,
    public HsLayerUtilsService: HsLayerUtilsService, //Used in template
    public HsDialogContainerService: HsDialogContainerService,
    public HsMapService: HsMapService,
    public HsFeatureTableService: HsFeatureTableService,
    private ElementRef: ElementRef
  ) {
    this.olMapLoadsSubscription = this.HsEventBusService.olMapLoads.subscribe(
      (map) => {
        map.addOverlay(this.HsQueryBaseService.hoverPopup);
      }
    );
  }
  ngAfterViewInit(): void {
    this.HsQueryBaseService.hoverPopup = new Overlay({
      element: this.ElementRef.nativeElement,
    });
  }
  ngOnDestroy(): void {
    this.HsMapService.map.removeOverlay(this.HsQueryBaseService.hoverPopup);
    this.olMapLoadsSubscription.unsubscribe();
  }

  popupVisible(): any {
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

    if (featureCount > 0) {
      this.HsQueryBaseService.featuresUnderMouse.forEach((feature) => {
        this.attributesForHover =
          this.HsQueryBaseService.serializeFeatureAttributes(feature);

        if (getFeatures(feature)) {
          getFeatures(feature).forEach((subfeature) => {
            const subFeatureObj: any = {};
            subFeatureObj.feature = subfeature;
            subFeatureObj.attributes =
              this.HsQueryBaseService.serializeFeatureAttributes(subfeature);
            this.attributesForHover.push(subFeatureObj);
          });
        }
      });
    }

    return {
      'display': featureCount > 0 ? 'block' : 'none',
    };
  }

  closePopup() {
    this.HsQueryBaseService.featuresUnderMouse = [];
  }

  isClustered(feature) {
    return getFeatures(feature) && getFeatures(feature).length > 0;
  }

  serializeFeatureName(feature) {
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
      return this.HsLanguageService.getTranslation('QUERY.clusterContaining', {
        count: getFeatures(feature).length,
      });
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

  //Deprecated
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
