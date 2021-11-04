import {Component, Input, OnDestroy} from '@angular/core';

import {Feature} from 'ol';
import {Geometry} from 'ol/geom';

import {HsFeatureWidgetContainerService} from './feature-widgets/feature-widget-container.service';
import {HsQueryPopupServiceModel} from '../query-popup.service.model';

@Component({
  selector: 'hs-query-popup-feature',
  templateUrl: './query-popup-feature.component.html',
})
export class HsQueryPopupFeatureComponent
  implements OnDestroy
{
  @Input() feature: Feature<Geometry>;
  @Input() attributesForHover: any;
  @Input() service: HsQueryPopupServiceModel;
  constructor(
    public hsFeatureWidgetContainerService: HsFeatureWidgetContainerService
  ) {}

  ngOnDestroy(): void {
    for (const panel of this.hsFeatureWidgetContainerService.panels.filter(
      (panel) => panel.data?.feature == this.feature
    )) {
      this.hsFeatureWidgetContainerService.destroy(panel);
    }
  }
}
