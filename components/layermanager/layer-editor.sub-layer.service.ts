import {HsLayerManagerService} from './layermanager.service';
import {HsLayerSelectorService} from './layer-selector.service';
import {Layer} from 'ol/layer';

import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class HsLayerEditorSublayerService {
  checkedSubLayers: any = {};
  withChildren: any = {};
  populatedLayers: Array<any> = [];
  withChildrenTmp: any = {};
  checkedSubLayersTmp: any = {};
  constructor(
    private HsLayerManagerService: HsLayerManagerService,
    private HsLayerSelectorService: HsLayerSelectorService
  ) {
    this.HsLayerSelectorService.layerSelected.subscribe((layer) => {
      this.resetSublayers(layer);
    });
  }
  resetSublayers(layer: Layer) {
    if (this.HsLayerManagerService.currentLayer) {
      this.checkedSubLayers = layer.layer.checkedSubLayers;
      this.checkedSubLayersTmp = layer.layer.checkedSubLayersTmp;

      this.withChildren = layer.layer.withChildren;
      this.withChildrenTmp = layer.layer.withChildrenTmp;
    }
  }
  hasSubLayers(): boolean {
    const subLayers = this.HsLayerManagerService.currentLayer.layer.get(
      'Layer'
    );
    return subLayers != undefined && subLayers.length > 0;
  }

  getSubLayers() {
    if (this.HsLayerManagerService.currentLayer === null) {
      return;
    }
    this.populateSubLayers();

    return this.HsLayerManagerService.currentLayer.layer.get('Layer');
  }

  populateSubLayers() {
    if (
      this.populatedLayers.includes(
        this.HsLayerManagerService.currentLayer.layer.ol_uid
      )
    ) {
      return;
    }
    const sublayers = this.HsLayerManagerService.currentLayer.layer.get(
      'Layer'
    );
    if (sublayers) {
      this.populatedLayers.push(
        this.HsLayerManagerService.currentLayer.layer.ol_uid
      );
      for (const layer of sublayers) {
        if (layer.Layer) {
          Object.assign(
            this.HsLayerManagerService.currentLayer.layer.withChildren,
            {
              [layer.Name]: this.HsLayerManagerService.currentLayer.layer.getVisible(),
            }
          );
          for (const sublayer of layer.Layer) {
            Object.assign(
              this.HsLayerManagerService.currentLayer.layer.checkedSubLayers,
              {
                [sublayer.Name]: this.HsLayerManagerService.currentLayer.layer.getVisible(),
              }
            );
          }
        } else {
          Object.assign(
            this.HsLayerManagerService.currentLayer.layer.checkedSubLayers,
            {
              [layer.Name]: this.HsLayerManagerService.currentLayer.layer.getVisible(),
            }
          );
        }
      }
      this.checkedSubLayers = this.HsLayerManagerService.currentLayer.layer.checkedSubLayers;
      this.withChildren = this.HsLayerManagerService.currentLayer.layer.withChildren;

      this.HsLayerManagerService.currentLayer.layer.checkedSubLayersTmp = this.checkedSubLayersTmp = Object.assign(
        {},
        this.checkedSubLayers
      );
      this.HsLayerManagerService.currentLayer.layer.withChildrenTmp = this.withChildrenTmp = Object.assign(
        {},
        this.withChildren
      );

      if (!this.HsLayerManagerService.currentLayer.visible) {
        Object.keys(this.checkedSubLayersTmp).forEach(
          (v) => (this.checkedSubLayersTmp[v] = true)
        );
        Object.keys(this.withChildrenTmp).forEach(
          (v) => (this.withChildrenTmp[v] = true)
        );
      }
    }
  }

  subLayerSelected(): void {
    const layer = this.HsLayerManagerService.currentLayer;
    const src = this.HsLayerManagerService.currentLayer.layer.getSource();
    const params = src.getParams();
    params.LAYERS = Object.keys(this.checkedSubLayers)
      .filter((key) => this.checkedSubLayers[key] && !this.withChildren[key])
      .join(',');
    if (params.LAYERS == '') {
      this.HsLayerManagerService.changeLayerVisibility(!layer.visible, layer);
      return;
    }
    if (layer.visible == false) {
      this.HsLayerManagerService.changeLayerVisibility(!layer.visible, layer);
    }
    src.updateParams(params);
  }
}
