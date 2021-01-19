import {Component, Input} from '@angular/core';

@Component({
  selector: 'legend-vector-layer-directive',
  templateUrl: './partials/layer-vector-directive.html',
})
export class HsLegendLayerVectorComponent {
  @Input('layer-style') layerStyle: any;
  @Input('geometry-type') geometryType: any;

  constructor() {}

  ngOnInit() {}
}
