import {Component, Input} from '@angular/core';

import {Feature} from 'ol';
import {Vector as VectorLayer} from 'ol/layer';
import {Vector as VectorSource} from 'ol/source';

import {HsTripPlannerService} from './trip-planner.service';

@Component({
  selector: 'hs-trip-planner-layer-selector',
  templateUrl: './layer-selector.component.html',
  standalone: false,
})
export class HsTripPlannerLayerSelectorComponent {
  @Input() label: string;
  @Input() usage: 'route' | 'waypoints';
  @Input() selectedWrapper: {
    layer: VectorLayer<VectorSource<Feature>>;
    title: string;
  };

  layersExpanded: boolean;

  constructor(public HsTripPlannerService: HsTripPlannerService) {}
}
