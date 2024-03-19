import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewRef,
} from '@angular/core';

import {BehaviorSubject, Subscription} from 'rxjs';

import {HsConfig} from 'hslayers-ng/config';
import {HsDialogComponent} from 'hslayers-ng/common/dialogs';
import {HsDialogItem} from 'hslayers-ng/common/dialogs';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsMapService} from 'hslayers-ng/services/map';
import {HsQueryPopupServiceModel} from './query-popup.service.model';
import {HsQueryPopupWidgetContainerService} from './query-popup-widget-container.service';
import {getFeatures} from 'hslayers-ng/common/extensions';
import {getPopUp} from 'hslayers-ng/common/extensions';

@Component({
  selector: 'hs-query-popup',
  templateUrl: './query-popup.component.html',
})
export class HsQueryPopupComponent
  implements OnDestroy, HsDialogComponent, AfterViewInit, OnInit
{
  getFeatures = getFeatures;
  attributesForHover = [];
  dialogItem?: HsDialogItem;
  viewRef: ViewRef;
  data: {
    service: HsQueryPopupServiceModel;
  };
  isVisible$ = new BehaviorSubject(true);

  constructor(
    private hsEventBusService: HsEventBusService,
    private hsMapService: HsMapService,
    private ElementRef: ElementRef,
    public hsQueryPopupWidgetContainerService: HsQueryPopupWidgetContainerService,
    private hsConfig: HsConfig,
  ) {}

  ngAfterViewInit(): void {
    this.data.service.registerPopup(this.ElementRef.nativeElement);
  }

  ngOnInit() {
    this.hsMapService.loaded().then((map) => {
      map.addOverlay(this.data.service.hoverPopup);
    });
    this.hsQueryPopupWidgetContainerService.initWidgets(
      this.hsConfig.queryPopupWidgets,
    );
  }

  ngOnDestroy(): void {
    this.hsMapService.getMap().removeOverlay(this.data.service.hoverPopup);
    this.hsQueryPopupWidgetContainerService.cleanup();
  }

  /**
   * Return popup visibility state
   */
  popupVisible(): any {
    const DISPLAY_NONE = {
      'display': 'none',
    };
    if (this.data.service == undefined) {
      return DISPLAY_NONE;
    }
    const featuresWithPopup = this.data.service.featuresUnderMouse.filter(
      (f) => {
        const layer = this.hsMapService.getLayerForFeature(f);
        if (!layer) {
          return DISPLAY_NONE;
        }
        return getPopUp(layer) != undefined;
      },
    );
    const featureCount = featuresWithPopup.length;
    if (featureCount > 0) {
      let tmpForHover: any[] = [];
      this.data.service.featuresUnderMouse.forEach((feature) => {
        tmpForHover = tmpForHover.concat(
          this.data.service.serializeFeatureAttributes(feature),
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
