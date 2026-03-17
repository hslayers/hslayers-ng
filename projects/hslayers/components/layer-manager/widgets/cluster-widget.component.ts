import {Component, OnInit, inject} from '@angular/core';

import Cluster from 'ol/source/Cluster';
import Feature from 'ol/Feature';

import {HsConfig} from 'hslayers-ng/config';
import {HsLayerEditorService} from '../editor/layer-editor.service';
import {HsLayerEditorWidgetBaseComponent} from './layer-editor-widget-base.component';

@Component({
  selector: 'hs-cluster-widget',
  templateUrl: './cluster-widget.component.html',
  styleUrls: ['./layer-editor-widgets.component.scss'],
  styles: [
    `
      .hs-cluster-distance .badge {
        font-size: 0.75rem;
        padding: 0.25rem 0.5rem;
        min-width: 2.5rem;
        text-align: center;
      }

      .hs-cluster-distance .form-range {
        cursor: pointer;
      }

      .hs-cluster-distance .form-range::-webkit-slider-thumb {
        transition: all 0.2s ease;
      }

      .hs-cluster-distance .form-range::-moz-range-thumb {
        transition: all 0.2s ease;
      }

      .hs-cluster-distance .form-range:hover::-webkit-slider-thumb {
        transform: scale(1.1);
      }

      .hs-cluster-distance .form-range:hover::-moz-range-thumb {
        transform: scale(1.1);
      }
    `,
  ],
  standalone: false,
})
export class HsClusterWidgetComponent
  extends HsLayerEditorWidgetBaseComponent
  implements OnInit
{
  private hsLayerEditorService = inject(HsLayerEditorService);
  private hsConfig = inject(HsConfig);

  name = 'cluster-widget';
  distance = {
    value: 40,
  };

  ngOnInit() {
    /* Call super ngOnInit manually as it's getting overridden by local one */
    super.ngOnInit();
    this.distance.value = this.setClusteringDistanceFromConfig();
  }

  /**
   * Set cluster for layer
   * @param newValue - To cluster or not to cluster
   */
  set cluster(newValue: boolean) {
    if (!this.layerDescriptor) {
      return;
    }
    this.hsLayerEditorService.cluster(
      this.olLayer,
      newValue,
      this.distance.value,
    );
  }

  /**
   * @returns Current cluster state
   */
  get cluster(): boolean | undefined {
    if (!this.layerDescriptor) {
      return;
    }
    return this.hsLayerEditorService.cluster(
      this.olLayer,
      undefined,
      this.distance.value,
    );
  }

  /**
   * Set distance between cluster features;
   */
  changeDistance(): void {
    if (!this.layerDescriptor) {
      return;
    }
    const layer = this.olLayer;
    const src = layer.getSource() as Cluster<Feature>;
    if (src.setDistance == undefined) {
      return;
    }
    src.setDistance(this.distance.value);
  }

  /**
   * Test if layer is WMS layer
   */
  isVectorLayer(): boolean | undefined {
    if (!this.layerDescriptor) {
      return;
    }
    const layer = this.olLayer;
    if (!this.hsLayerEditorService.isLayerVectorLayer(layer)) {
      return;
    }
    return true;
  }

  /**
   * Parse initial cluster distance value
   */
  private setClusteringDistanceFromConfig(): number {
    const distance = this.hsConfig.clusteringDistance ?? this.distance.value;
    return distance > 100 ? 100 : distance;
  }
}
