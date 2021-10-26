import {Component} from '@angular/core';

import {Cluster} from 'ol/source';

import {HsLayerEditorService} from '../editor/layer-editor.service';
import {HsLayerEditorWidgetBaseComponent} from './layer-editor-widget-base.component';
import {HsLayerSelectorService} from '../editor/layer-selector.service';

@Component({
  selector: 'hs-cluster-widget',
  templateUrl: './cluster-widget.component.html',
})
export class HsClusterWidgetComponent extends HsLayerEditorWidgetBaseComponent {
  name = 'cluster-widget';
  distance = {
    value: 40,
  };

  constructor(
    hsLayerSelectorService: HsLayerSelectorService,
    private HsLayerEditorService: HsLayerEditorService
  ) {
    super(hsLayerSelectorService);
  }

  /**
   * Set cluster for layer
   * @param newValue - To cluster or not to cluster
   */
  set cluster(newValue: boolean) {
    if (!this.currentLayer) {
      return;
    }
    this.HsLayerEditorService.cluster(
      this.olLayer(),
      newValue,
      this.distance.value
    );
  }

  /**
   * @returns Current cluster state
   */
  get cluster(): boolean | undefined {
    if (!this.currentLayer) {
      return;
    }
    return this.HsLayerEditorService.cluster(
      this.olLayer(),
      undefined,
      this.distance.value
    );
  }

  /**
   * Set distance between cluster features;
   */
  changeDistance(): void {
    if (!this.currentLayer) {
      return;
    }
    const layer = this.olLayer();
    const src = layer.getSource() as Cluster;
    if (src.setDistance == undefined) {
      return;
    }
    src.setDistance(this.distance.value);
  }

  /**
   * Test if layer is WMS layer
   */
  isVectorLayer(): boolean | undefined {
    if (!this.currentLayer) {
      return;
    }
    const layer = this.olLayer();
    if (!this.HsLayerEditorService.isLayerVectorLayer(layer)) {
      return;
    } else {
      return true;
    }
  }
}
