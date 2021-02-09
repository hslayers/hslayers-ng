import {HsLayerDescriptor} from './layer-descriptor.interface';
import {HsLayerManagerService} from './layermanager.service';
import {HsLayerSelectorService} from './layer-selector.service';
import {getCachedCapabilities} from '../../common/layer-extensions';

import {Layer} from 'ol/layer';

import {Injectable} from '@angular/core';

export type KeyBooleanDict = {
  [key: string]: boolean;
};

@Injectable({
  providedIn: 'root',
})
export class HsLayerEditorSublayerService {
  checkedSubLayers: KeyBooleanDict = {};
  withChildren: KeyBooleanDict = {};
  populatedLayers: Array<any> = [];
  withChildrenTmp: KeyBooleanDict = {};
  checkedSubLayersTmp: KeyBooleanDict = {};
  constructor(
    public HsLayerManagerService: HsLayerManagerService,
    public HsLayerSelectorService: HsLayerSelectorService
  ) {
    this.HsLayerSelectorService.layerSelected.subscribe((layer) => {
      this.resetSublayers(layer);
    });
  }
  resetSublayers(layer: HsLayerDescriptor) {
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

    return (
      getCachedCapabilities(this.HsLayerManagerService.currentLayer.layer)
        ?.Layer || []
    );
  }

  populateSubLayers() {
    const layer = this.HsLayerManagerService.currentLayer.layer;
    if (this.populatedLayers.includes(layer.ol_uid)) {
      return;
    }
    const subLayers = getCachedCapabilities(layer)?.Layer;
    if (subLayers?.length > 0) {
      //Visibility of leaf layers the same as oldest ancestor
      const visible = layer.getVisible();
      //We don't want to overwrite saved sub-layer states when changing current layer
      const clone = (src) => Object.assign({}, src);
      //Function which converts list of layers to dictionary of their names and visibility
      const toDictionary = (d, layer) => ((d[layer.Name] = visible), d);

      this.populatedLayers.push(layer.ol_uid);
      const subLayersWithChild = subLayers.filter((sl) => sl.Layer);
      const subSubLayers = subLayersWithChild.map((sl) => sl.Layer).flat();
      layer.withChildren = subLayersWithChild.reduce(toDictionary, {});
      //List either 3rd level layers or second if no 3rd level layer exists
      const leafs = subSubLayers.length > 0 ? subSubLayers : subLayers;
      layer.checkedSubLayers = leafs.reduce(toDictionary, {});

      this.checkedSubLayers = layer.checkedSubLayers;
      this.withChildren = layer.withChildren;
      this.checkedSubLayersTmp = clone(this.checkedSubLayers);
      layer.checkedSubLayersTmp = this.checkedSubLayersTmp;
      this.withChildrenTmp = clone(this.withChildren);
      layer.withChildrenTmp = this.withChildrenTmp;

      if (!this.HsLayerManagerService.currentLayer.visible) {
        for (const dict of [this.checkedSubLayersTmp, this.withChildrenTmp]) {
          Object.keys(dict).forEach((v) => (dict[v] = true));
        }
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
