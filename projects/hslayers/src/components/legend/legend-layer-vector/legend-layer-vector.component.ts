import {Component} from '@angular/core';

import {HsLegendService} from '../legend.service';

@Component({
  selector: 'hs-legend-vector-layer',
  templateUrl: './legend-layer-vector.component.html',
})
export class HsLegendLayerVectorComponent {
  constructor(public hsLegendService: HsLegendService) {}
}
