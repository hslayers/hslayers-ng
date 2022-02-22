import {Component, Input} from '@angular/core';

import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import {Geometry} from 'ol/geom';

import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsTripPlannerService} from './trip-planner.service';

@Component({
  selector: 'hs-trip-planner-layer-selector',
  templateUrl: './layer-selector.html',
})
export class HsTripPlannerLayerSelectorComponent {
  @Input() label: string;
  @Input() app = 'default';
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
