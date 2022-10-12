import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewRef,
} from '@angular/core';

import {BehaviorSubject, Subscription} from 'rxjs';

import {HsConfig} from '../../../config.service';
import {HsDialogComponent} from '../../layout/dialogs/dialog-component.interface';
import {HsDialogItem} from '../../layout/dialogs/dialog-item';
import {HsEventBusService} from '../../core/event-bus.service';
import {HsMapService} from '../../map/map.service';
import {HsQueryPopupServiceModel} from '../query-popup.service.model';
import {HsQueryPopupWidgetContainerService} from '../query-popup-widget-container.service';
import {HsQueryVectorService} from '../query-vector.service';
import {getFeatures} from '../../../common/feature-extensions';
import {getPopUp} from '../../../common/layer-extensions';

@Component({
  selector: 'hs-query-popup',
  templateUrl: './query-popup.component.html',
})
export class HsQueryPopupComponent
  implements OnDestroy, HsDialogComponent, AfterViewInit, OnInit
{
  getFeatures = getFeatures;
  olMapLoadsSubscription: Subscription;
  attributesForHover = [];
  dialogItem?: HsDialogItem;
  viewRef: ViewRef;
  data: {
    service: HsQueryPopupServiceModel;
    app: string;
  };
  dataAppRef;
  isVisible$ = new BehaviorSubject(true);

  constructor(
    private hsEventBusService: HsEventBusService,
    private hsMapService: HsMapService,
    private ElementRef: ElementRef,
    public hsQueryPopupWidgetContainerService: HsQueryPopupWidgetContainerService,
    private hsConfig: HsConfig,
    private HsQueryVectorService: HsQueryVectorService
  ) {}

  ngAfterViewInit(): void {
    this.data.service.registerPopup(
      this.ElementRef.nativeElement,
      this.data.app
    );
  }

  ngOnInit() {
    this.dataAppRef = this.data.service.apps[this.data.app];
    this.HsQueryVectorService.init(this.data.app);
    this.olMapLoadsSubscription = this.hsEventBusService.olMapLoads.subscribe(
      ({map, app}) => {
        if (app == this.data.app) {
          map.addOverlay(this.dataAppRef.hoverPopup);
        }
      }
    );
    this.hsQueryPopupWidgetContainerService.initWidgets(
      this.hsConfig.get(this.data.app).queryPopupWidgets,
      this.data.app
    );
  }

  ngOnDestroy(): void {
    this.hsMapService
      .getMap(this.data.app)
      .removeOverlay(this.dataAppRef.hoverPopup);
    this.hsQueryPopupWidgetContainerService.cleanup(this.data.app);
    this.olMapLoadsSubscription.unsubscribe();
  }

  /**
   * Return popup visibility state
   */
  popupVisible(): any {
    const DISPLAY_NONE = {
      'display': 'none',
    };
    if (this.dataAppRef == undefined) {
      return DISPLAY_NONE;
    }
    const featuresWithPopup = this.dataAppRef.featuresUnderMouse.filter((f) => {
      const layer = this.hsMapService.getLayerForFeature(f, this.data.app);
      if (!layer) {
        return DISPLAY_NONE;
      }
      return getPopUp(layer) != undefined;
    });
    const featureCount = featuresWithPopup.length;
    if (featureCount > 0) {
      let tmpForHover: any[] = [];
      this.dataAppRef.featuresUnderMouse.forEach((feature) => {
        tmpForHover = tmpForHover.concat(
          this.data.service.serializeFeatureAttributes(feature, this.data.app)
        );
        if (getFeatures(feature)) {
          getFeatures(feature).forEach((subfeature) => {
            const subFeatureObj: any = {};
            subFeatureObj.feature = subfeature;
            subFeatureObj.attributes =
              this.data.service.serializeFeatureAttributes(
                subfeature,
                this.data.app
              );
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
