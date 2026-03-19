import {Component, Input} from '@angular/core';

@Component({
  selector: 'hs-legend-vector-layer',
  templateUrl: './legend-layer-vector.component.html',
  styles: `
    :host ::ng-deep {
      .geostyler-legend-renderer {
        .legend-title {
          display: none;
        }
      }
    }
  `,
})
export class HsLegendLayerVectorComponent {
  @Input() svg: string;

  constructor() {}
}
