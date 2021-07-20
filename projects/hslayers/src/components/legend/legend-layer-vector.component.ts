import {Component, Input} from '@angular/core';

@Component({
  selector: 'hs-legend-vector-layer',
  templateUrl: './partials/layer-vector-directive.html',
})
export class HsLegendLayerVectorComponent {
  @Input('layer-style') layerStyle: any;
  @Input('geometry-type') geometryType: any;

  constructor() {}
}
