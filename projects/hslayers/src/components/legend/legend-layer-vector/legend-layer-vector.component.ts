import {Component, Input} from '@angular/core';

@Component({
  selector: 'hs-legend-vector-layer',
  templateUrl: './legend-layer-vector.component.html',
})
export class HsLegendLayerVectorComponent {
  @Input('layer-style') layerStyle: any;
  @Input('geometry-type') geometryType: any;

  constructor() {}
}
