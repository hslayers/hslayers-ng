import {Component, OnInit} from '@angular/core';

import {Cluster} from 'ol/source';
import {Feature} from 'ol';

import {HsConfig} from 'hslayers-ng/config';
import {HsLayerEditorService} from '../editor/layer-editor.service';
import {HsLayerEditorWidgetBaseComponent} from './layer-editor-widget-base.component';
import {HsLayerSelectorService} from 'hslayers-ng/services/layer-manager';

@Component({
  selector: 'hs-cluster-widget',
  templateUrl: './cluster-widget.component.html',
})
export class HsClusterWidgetComponent
  extends HsLayerEditorWidgetBaseComponent
  implements OnInit
{
  name = 'cluster-widget';
  distance = {
    value: 40,
  };

  constructor(
    hsLayerSelectorService: HsLayerSelectorService,
    private HsLayerEditorService: HsLayerEditorService,
    private hsConfig: HsConfig,
  ) {
    super(hsLayerSelectorService);
  }

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
    this.HsLayerEditorService.cluster(
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
    return this.HsLayerEditorService.cluster(
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
    if (!this.HsLayerEditorService.isLayerVectorLayer(layer)) {
      return;
    } else {
      return true;
    }
  }

  /**
   * Parse initial cluster distance value
   */
  private setClusteringDistanceFromConfig(): number {
    const distance = this.hsConfig.clusteringDistance ?? this.distance.value;
    return distance > 100 ? 100 : distance;
  }
}
