import {Component, Input} from '@angular/core';
import {SafeHtml} from '@angular/platform-browser';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

import {HsLegendService} from '../legend.service';
import {HsStylerService} from 'hslayers-ng/services/styler';
import {HsUtilsService} from 'hslayers-ng/services/utils';

@Component({
  selector: 'hs-legend-layer-directive',
  templateUrl: './legend-layer.component.html',
})
export class HsLegendLayerComponent {
  @Input() layer: any;

  //svg: SafeHtml;
  legendCategories;
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
    this.legendCategories = this.layer.lyr.getSource()?.get('legendCategories');
  }
}
