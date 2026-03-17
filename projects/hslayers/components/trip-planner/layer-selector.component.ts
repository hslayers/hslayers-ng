import {Component, Input, inject} from '@angular/core';

import Feature from 'ol/Feature';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

import {HsTripPlannerService} from './trip-planner.service';

@Component({
  selector: 'hs-trip-planner-layer-selector',
  templateUrl: './layer-selector.component.html',
  standalone: false,
})
export class HsTripPlannerLayerSelectorComponent {
  hsTripPlannerService = inject(HsTripPlannerService);

  @Input() label: string;
  @Input() usage: 'route' | 'waypoints';
  @Input() selectedWrapper: {
    layer: VectorLayer<VectorSource<Feature>>;
    title: string;
  };

  layersExpanded: boolean;
}
