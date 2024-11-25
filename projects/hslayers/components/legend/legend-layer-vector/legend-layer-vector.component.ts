import {Component, Input} from '@angular/core';

@Component({
  selector: 'hs-legend-vector-layer',
  templateUrl: './legend-layer-vector.component.html',
  styles: `
    :host ::ng-deep {
      .geostyler-legend-renderer {
        .legend-title {
          transform: translateY(-7px);
        }
      }
    }
  `,
})
export class HsLegendLayerVectorComponent {
  @Input() svg: string;

  constructor() {}
}
