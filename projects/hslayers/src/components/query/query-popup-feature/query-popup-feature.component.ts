import {Component, Input} from '@angular/core';

import {Feature} from 'ol';
import {Geometry} from 'ol/geom';

import {HsFeatureWidgetContainerService} from './feature-widgets/feature-widget-container.service';
import {HsQueryPopupServiceModel} from '../query-popup.service.model';

@Component({
  selector: 'hs-query-popup-feature',
  templateUrl: './query-popup-feature.component.html',
})
export class HsQueryPopupFeatureComponent {
  @Input() feature: Feature<Geometry>;
  @Input() attributesForHover: any;
  @Input() service: HsQueryPopupServiceModel;
  constructor(
    public hsFeatureWidgetContainerService: HsFeatureWidgetContainerService
  ) {}
}
