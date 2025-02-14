import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewRef,
} from '@angular/core';

import {BehaviorSubject} from 'rxjs';

import {HsConfig} from 'hslayers-ng/config';
import {HsDialogComponent, HsDialogItem} from 'hslayers-ng/common/dialogs';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsMapService} from 'hslayers-ng/services/map';
import {HsQueryPopupServiceModel} from './query-popup.service.model';
import {HsQueryPopupWidgetContainerService} from './query-popup-widget-container.service';
import {getFeatures} from 'hslayers-ng/common/extensions';

@Component({
  selector: 'hs-query-popup',
  templateUrl: './query-popup.component.html',
  standalone: false,
  styles: `
    .hs-hover-popup .fa-xmark {
      color: rgb(73, 80, 87);
      float: right;
    }

    .hs-hover-popup .card {
      padding: 5px;
      overflow-y: auto;
    }

    .hs-hover-popup {
      max-height: 20em;
      min-width: 10em;
      max-width: 40em;
      overflow-y: auto;
      visibility: visible;
      background: white;
    }
  `,
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
    const featureCount = this.data.service.featureLayersUnderMouse.reduce(
      (acc, featureLayer) => acc + featureLayer.features.length,
      0,
    );
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
