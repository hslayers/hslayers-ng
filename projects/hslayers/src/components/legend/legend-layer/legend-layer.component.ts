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
          this.hsLegendService.setSvg(layer);
        }
      });
  }

  ngOnInit(): void {
    const olLayer = this.layer.lyr;
    this.initLayer(olLayer);
  }

  async initLayer(olLayer: any): Promise<void> {
    if (this.hsUtilsService.instOf(olLayer, VectorLayer)) {
      this.hsLegendService.setSvg(olLayer);
    }
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
