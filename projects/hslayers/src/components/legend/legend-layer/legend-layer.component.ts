import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {SafeHtml} from '@angular/platform-browser';

import VectorLayer from 'ol/layer/Vector';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {HsLegendService} from '../legend.service';
import {HsStylerService} from '../../styles/styler.service';
import {HsUtilsService} from '../../utils/utils.service';

@Component({
  selector: 'hs-legend-layer-directive',
  templateUrl: './legend-layer.component.html',
})
export class HsLegendLayerComponent implements OnInit, OnDestroy {
  @Input() layer: any;
  svg: SafeHtml;
  private ngUnsubscribe = new Subject();
  constructor(
    public hsUtilsService: HsUtilsService,
    public hsLegendService: HsLegendService,
    public hsStylerService: HsStylerService
  ) {
    this.hsStylerService.onSet
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(async (layer) => {
        if (this.layer.lyr == layer) {
          this.svg = await this.hsLegendService.getVectorLayerLegendSvg(
            this.layer.lyr
          );
        }
      });
  }

  ngOnInit(): void {
    const olLayer = this.layer.lyr;
    this.initLayer(olLayer);
  }

  private async initLayer(olLayer: any) {
    if (this.hsUtilsService.instOf(olLayer, VectorLayer)) {
      this.svg = await this.hsLegendService.getVectorLayerLegendSvg(olLayer);
    }
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
