import {Component, Input} from '@angular/core';

import {Geometry} from 'ol/geom';
import {Vector as VectorLayer} from 'ol/layer';
import {Vector as VectorSource} from 'ol/source';

import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsTripPlannerService} from './trip-planner.service';

@Component({
  selector: 'hs-trip-planner-layer-selector',
  templateUrl: './layer-selector.html',
})
export class HsTripPlannerLayerSelectorComponent {
  @Input() label: string;
  
  @Input() usage: 'route' | 'waypoints';
  @Input() selectedwrapper: {
    layer: VectorLayer<VectorSource<Geometry>>;
    title: string;
  };

  layersExpanded: boolean;

  constructor(
    public HsTripPlannerService: HsTripPlannerService,
    public HsLayerUtilsService: HsLayerUtilsService
  ) {}
}
