import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewRef,
} from '@angular/core';

import {Subscription} from 'rxjs';

import {HsConfig} from '../../../config.service';
import {HsDialogComponent} from '../../layout/dialogs/dialog-component.interface';
import {HsDialogItem} from '../../layout/dialogs/dialog-item';
import {HsEventBusService} from '../../core/event-bus.service';
import {HsLanguageService} from '../../language/language.service';
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
  implements OnDestroy, HsDialogComponent, AfterViewInit {
  getFeatures = getFeatures;
  olMapLoadsSubscription: Subscription;
  attributesForHover = [];
  dialogItem?: HsDialogItem;
  viewRef: ViewRef;
  data: {
    service: HsQueryPopupServiceModel;
    app: string;
  };

  constructor(
    public hsEventBusService: HsEventBusService,
    public hsLanguageService: HsLanguageService,
    public hsMapService: HsMapService,
    private ElementRef: ElementRef,
    public hsQueryPopupWidgetContainerService: HsQueryPopupWidgetContainerService,
    private hsConfig: HsConfig,
    private HsQueryVectorService: HsQueryVectorService
  ) {
    this.olMapLoadsSubscription = this.hsEventBusService.olMapLoads.subscribe(
      ({map, app}) => {
        if (app == this.data.app) {
          map.addOverlay(this.data.service.apps[this.data.app].hoverPopup);
        }
      }
    );
  }

  ngAfterViewInit(): void {
    this.data.service.registerPopup(
      this.ElementRef.nativeElement,
      this.data.app
    );
  }

  ngOnInit() {
    this.HsQueryVectorService.init(this.data.app);
    this.hsQueryPopupWidgetContainerService.initWidgets(
      this.hsConfig.get(this.data.app).queryPopupWidgets,
      this.data.app
    );
  }

  ngOnDestroy(): void {
    this.hsMapService
      .getMap(this.data.app)
      .removeOverlay(this.data.service.apps[this.data.app].hoverPopup);
    this.olMapLoadsSubscription.unsubscribe();
  }

  popupVisible(): any {
    if (this.data.service.apps[this.data.app] == undefined) {
      return false;
    }
    const featuresWithPopup = this.data.service.apps[
      this.data.app
    ].featuresUnderMouse.filter((f) => {
      const layer = this.hsMapService.getLayerForFeature(f, this.data.app);
      if (!layer) {
        return false;
      }
      return getPopUp(layer) != undefined;
    });
    const featureCount = featuresWithPopup.length;
    if (featureCount > 0) {
      let tmpForHover: any[] = [];
      this.data.service.apps[this.data.app].featuresUnderMouse.forEach(
        (feature) => {
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
        }
      );
      this.attributesForHover = tmpForHover.filter((f) => f);
    }

    return {
      'display': featureCount > 0 ? 'block' : 'none',
    };
  }
}
