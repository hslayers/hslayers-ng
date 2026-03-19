import {Component, Input, OnInit, signal, inject} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {NgStyle} from '@angular/common';

import {HsCustomLegendCategory} from '../legend-custom-category.type';
import {HsLegendDescriptor} from '../legend-descriptor.interface';
import {HsLegendLayerStaticComponent} from '../legend-layer-static/legend-layer-static.component';
import {HsLegendLayerVectorComponent} from '../legend-layer-vector/legend-layer-vector.component';
import {HsLegendService} from '../legend.service';
import {HsStylerService} from 'hslayers-ng/services/styler';

@Component({
  selector: 'hs-legend-layer',
  templateUrl: './legend-layer.component.html',

  imports: [
    HsLegendLayerStaticComponent,
    HsLegendLayerVectorComponent,
    NgStyle,
  ],
})
export class HsLegendLayerComponent implements OnInit {
  hsLegendService = inject(HsLegendService);
  hsStylerService = inject(HsStylerService);

  @Input() layer: HsLegendDescriptor;

  legendCategories: HsCustomLegendCategory[];
  hasLegendCategories = signal(false);
  /**
   * default icon height in pixels
   * @default 32
   */
  defaultIconHeight = 32;

  constructor() {
    this.hsStylerService.onSet
      .pipe(takeUntilDestroyed())
      .subscribe(async (layer) => {
        if (this.layer.lyr == layer) {
          this.layer.svg = await this.hsLegendService.setSvg(layer);
        }
      });
  }
  ngOnInit(): void {
    this.legendCategories = this.layer.lyr.getSource()?.get('legendCategories');
    this.hasLegendCategories.set(this.legendCategories?.length > 0);
  }
}
