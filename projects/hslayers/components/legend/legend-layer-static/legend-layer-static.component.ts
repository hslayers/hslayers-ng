import {Component, Input, OnInit} from '@angular/core';

import {HsLegendLayerStaticService} from './legend-layer-static.service';
import {LayerLegend} from './types/layer-legend.type';
import {getLegends} from 'hslayers-ng/common/extensions';

@Component({
  selector: 'hs-legend-layer-static',
  templateUrl: './legend-layer-static.component.html',
})
export class HsLegendLayerStaticComponent implements OnInit {
  @Input() layer: any;
  layerLegend: LayerLegend = {};

  constructor(private hsLegendLayerStaticService: HsLegendLayerStaticService) {}

  ngOnInit(): void {
    if (getLegends(this.layer.lyr)) {
      Object.assign(
        this.layerLegend,
        this.hsLegendLayerStaticService.fillContent(this.layer.lyr),
      );
    }
    this.layer.lyr.on('change', (e) => {
      //TODO: Maybe rewrite this to something more fancy like Observable
      if (getLegends(this.layer.lyr) != this.layerLegend.lastLegendImage) {
        this.hsLegendLayerStaticService.fillContent(this.layer.lyr);
      }
    });
  }
}
