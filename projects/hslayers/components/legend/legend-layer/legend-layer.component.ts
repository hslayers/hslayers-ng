import {Component, Input, OnInit, signal} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

import {HsCustomLegendCategory} from '../legend-custom-category.type';
import {HsLegendDescriptor} from '../legend-descriptor.interface';
import {HsLegendService} from '../legend.service';
import {HsStylerService} from 'hslayers-ng/services/styler';
import {HsUtilsService} from 'hslayers-ng/services/utils';

@Component({
  selector: 'hs-legend-layer',
  templateUrl: './legend-layer.component.html',
})
export class HsLegendLayerComponent implements OnInit {
  @Input() layer: HsLegendDescriptor;

  legendCategories: HsCustomLegendCategory[];
  hasLegendCategories = signal(false);
  /**
   * default icon height in pixels
   * @default 32
   */
  defaultIconHeight = 32;

  constructor(
    public hsUtilsService: HsUtilsService,
    public hsLegendService: HsLegendService,
    public hsStylerService: HsStylerService,
  ) {
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
