import {Component, Input, OnDestroy, OnInit} from '@angular/core';

import VectorLayer from 'ol/layer/Vector';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {HsLegendService} from './legend.service';
import {HsStylerService} from '../styles/styler.service';
import {HsUtilsService} from '../utils/utils.service';

@Component({
  selector: 'hs-legend-layer-directive',
  templateUrl: './partials/legend-layer.component.html',
})
export class HsLegendLayerComponent implements OnInit, OnDestroy {
  @Input() layer: any;
  styles = [];
  geometryTypes = [];
  private ngUnsubscribe = new Subject();
  constructor(
    public hsUtilsService: HsUtilsService,
    public hsLegendService: HsLegendService,
    public hsStylerService: HsStylerService
  ) {
    this.hsStylerService.onSet
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((_) => {
        this.styles = this.hsLegendService.getStyleVectorLayer(this.layer.lyr);
        this.geometryTypes = this.hsLegendService.getVectorFeatureGeometry(
          this.layer.lyr
        );
      });
  }

  ngOnInit(): void {
    const olLayer = this.layer.lyr;

    if (this.hsUtilsService.instOf(olLayer, VectorLayer)) {
      this.styles = this.hsLegendService.getStyleVectorLayer(olLayer);
      this.geometryTypes =
        this.hsLegendService.getVectorFeatureGeometry(olLayer);
    }
    if (olLayer.getSource()) {
      const source = olLayer.getSource();
      const changeHandler = this.hsUtilsService.debounce(
        (e) => {
          this.styles = this.hsLegendService.getStyleVectorLayer(olLayer);
          this.geometryTypes =
            this.hsLegendService.getVectorFeatureGeometry(olLayer);
        },
        200,
        false,
        this
      );
      source.on('changefeature', changeHandler);
      source.on('addfeature', changeHandler);
      source.on('removefeature', changeHandler);
    }
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
