import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewRef,
} from '@angular/core';

import {Subscription} from 'rxjs';

import {HsDialogComponent} from '../../layout/dialogs/dialog-component.interface';
import {HsDialogItem} from '../../layout/dialogs/dialog-item';
import {HsEventBusService} from '../../core/event-bus.service';
import {HsLanguageService} from '../../language/language.service';
import {HsMapService} from '../../map/map.service';
import {HsQueryPopupServiceModel} from '../query-popup.service.model';
import {HsQueryPopupWidgetContainerService} from '../query-popup-widget-container.service';
import {getFeatures} from '../../../common/feature-extensions';
import {getPopUp} from '../../../common/layer-extensions';

@Component({
  selector: 'hs-query-popup',
  templateUrl: './query-popup.component.html',
})
export class HsQueryPopupComponent
  implements OnDestroy, HsDialogComponent, AfterViewInit
{
  getFeatures = getFeatures;
  olMapLoadsSubscription: Subscription;
  attributesForHover = [];
  dialogItem?: HsDialogItem;
  viewRef: ViewRef;
  data: {
    service: HsQueryPopupServiceModel;
  };

  constructor(
    public hsEventBusService: HsEventBusService,
    public hsLanguageService: HsLanguageService,
    public hsMapService: HsMapService,
    private ElementRef: ElementRef,
    public hsQueryPopupWidgetContainerService: HsQueryPopupWidgetContainerService
  ) {
    this.olMapLoadsSubscription = this.hsEventBusService.olMapLoads.subscribe(
      (map) => {
        map.addOverlay(this.data.service.hoverPopup);
      }
    );
  }

  ngAfterViewInit(): void {
    this.data.service.registerPopup(this.ElementRef.nativeElement);
  }

  ngOnDestroy(): void {
    this.hsMapService.map.removeOverlay(this.data.service.hoverPopup);
    this.olMapLoadsSubscription.unsubscribe();
  }

  popupVisible(): any {
    const featuresWithPopup = this.data.service.featuresUnderMouse.filter(
      (f) => {
        const layer = this.hsMapService.getLayerForFeature(f);
        if (!layer) {
          return false;
        }
        return getPopUp(layer) != undefined;
      }
    );
    const featureCount = featuresWithPopup.length;

    if (featureCount > 0) {
      let tmpForHover: any[] = [];
      this.data.service.featuresUnderMouse.forEach((feature) => {
        tmpForHover = tmpForHover.concat(
          this.data.service.serializeFeatureAttributes(feature)
        );
        if (getFeatures(feature)) {
          getFeatures(feature).forEach((subfeature) => {
            const subFeatureObj: any = {};
            subFeatureObj.feature = subfeature;
            subFeatureObj.attributes =
              this.data.service.serializeFeatureAttributes(subfeature);
            tmpForHover.push(subFeatureObj);
          });
        }
      });
      this.attributesForHover = tmpForHover.filter((f) => f);
    }

    return {
      'display': featureCount > 0 ? 'block' : 'none',
    };
  }
}
