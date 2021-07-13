import {Component, Input} from '@angular/core';

import VectorLayer from 'ol/layer/Vector';

import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsTripPlannerService} from './trip-planner.service';

@Component({
  selector: 'hs-trip-planner-layer-selector',
  templateUrl: './layer-selector.html',
})
export class HsTripPlannerLayerSelectorComponent {
  @Input() label: string;
  @Input() usage: 'route' | 'waypoints';
  @Input() selectedwrapper: {layer: VectorLayer; title: string};

  layersExpanded: boolean;

  constructor(
    public HsTripPlannerService: HsTripPlannerService,
    public HsLayerUtilsService: HsLayerUtilsService
  ) {}
}
