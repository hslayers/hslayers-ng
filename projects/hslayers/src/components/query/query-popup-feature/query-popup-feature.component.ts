import {AfterContentInit, Component, Input, OnDestroy} from '@angular/core';

import {HsFeatureWidgetContainerService} from './feature-widgets/feature-widget-container.service';
import {HsQueryPopupServiceModel} from '../query-popup.service.model';

@Component({
  selector: 'hs-query-popup-feature',
  templateUrl: './query-popup-feature.component.html',
})
export class HsQueryPopupFeatureComponent
  implements AfterContentInit, OnDestroy
{
  @Input() feature: any;
  @Input() service: HsQueryPopupServiceModel;
  constructor(
    public hsFeatureWidgetContainerService: HsFeatureWidgetContainerService
  ) {}

  ngAfterContentInit(): void {
    this.hsFeatureWidgetContainerService.createWithOwner(
      this,
      HsFeatureInfoComponent,
      {
        feature: this.feature,
        service: this.service,
      }
    );
  }

  ngOnDestroy(): void {
    for (const panel of this.hsFeatureWidgetContainerService.panels.filter(
      (panel) => panel.data?.feature == this.feature
    )) {
      this.hsFeatureWidgetContainerService.destroy(panel);
    }
  }
}
