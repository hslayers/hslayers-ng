import VectorLayer from 'ol/layer/Vector';
import {Component, Input} from '@angular/core';
import {HsLegendService} from './legend.service';
import {HsUtilsService} from '../utils/utils.service';

@Component({
  selector: 'hs-legend-layer-directive',
  templateUrl: './partials/layer-directive.html',
})
export class HsLegendLayerComponent {
  @Input('layer') layer: any;
  styles = [];
  geometryTypes = [];

  constructor(
    public HsUtilsService: HsUtilsService,
    public HsLegendService: HsLegendService
  ) {}

  ngOnInit(): void {
    const olLayer = this.layer.lyr;

    if (this.HsUtilsService.instOf(olLayer, VectorLayer)) {
      this.styles = this.HsLegendService.getStyleVectorLayer(olLayer);
      this.geometryTypes = this.HsLegendService.getVectorFeatureGeometry(
        olLayer
      );
    }
    if (olLayer.getSource()) {
      const source = olLayer.getSource();
      const changeHandler = this.HsUtilsService.debounce(
        (e) => {
          this.styles = this.HsLegendService.getStyleVectorLayer(olLayer);
          this.geometryTypes = this.HsLegendService.getVectorFeatureGeometry(
            olLayer
          );
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
}
