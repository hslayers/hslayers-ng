import {Component, Input} from '@angular/core';

import {Feature} from 'ol';
import {Vector as VectorLayer} from 'ol/layer';

import {HsLayerUtilsService} from 'hslayers-ng/services/utils';
import {HsTripPlannerService} from './trip-planner.service';

@Component({
  selector: 'hs-trip-planner-layer-selector',
  templateUrl: './layer-selector.component.html',
})
export class HsTripPlannerLayerSelectorComponent {
  @Input() label: string;
  @Input() usage: 'route' | 'waypoints';
  @Input() selectedWrapper: {
    layer: VectorLayer<Feature>;
    title: string;
  };

  layersExpanded: boolean;

  constructor(
    public HsTripPlannerService: HsTripPlannerService,
    public HsLayerUtilsService: HsLayerUtilsService,
  ) {}
}
