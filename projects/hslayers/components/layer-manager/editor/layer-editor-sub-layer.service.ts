import {Injectable} from '@angular/core';

import {HsLayerDescriptor} from '../layer-descriptor.interface';
import {HsLayerManagerService} from '../layer-manager.service';
import {HsLayerSelectorService} from './layer-selector.service';
import {HsLayerUtilsService} from 'hslayers-ng/shared/utils';
import {getCachedCapabilities} from 'hslayers-ng/common/extensions';

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
    public HsLayerSelectorService: HsLayerSelectorService,
    private HsLayerUtilsService: HsLayerUtilsService,
  ) {
    this.HsLayerSelectorService.layerSelected.subscribe((layer) => {
      this.resetSublayers(layer);
    });
  }

  resetSublayers(layer: HsLayerDescriptor) {
    if (this.HsLayerManagerService.currentLayer) {
      this.checkedSubLayers = layer.checkedSubLayers;
      this.checkedSubLayersTmp = layer.checkedSubLayersTmp;

      this.withChildren = layer.withChildren;
      this.withChildrenTmp = layer.withChildrenTmp;
    }
  }
  hasSubLayers(): boolean {
    const subLayers = getCachedCapabilities(
      this.HsLayerManagerService.currentLayer.layer,
    )?.Layer;
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
    const wrapper = this.HsLayerManagerService.currentLayer;
    const layer = wrapper.layer;
    if (this.populatedLayers.includes(wrapper.uid)) {
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

      this.populatedLayers.push(wrapper.uid);
      const subLayersWithChild = subLayers.filter((sl) => sl.Layer);
      let subSubLayers = subLayersWithChild.flatMap((sl) => sl.Layer);
      //Check one level deeper for the sublayers
      subSubLayers = subSubLayers.filter((sl) => {
        if (sl.Layer) {
          subLayersWithChild.push(sl);
        }
        return sl.Layer;
      });
      wrapper.withChildren = subLayersWithChild.reduce(toDictionary, {});
      //List either 3rd level layers or second if no 3rd level layer exists
      const leafs =
        subSubLayers.length > 0
          ? [...subLayers.filter((sl) => !sl.Layer), ...subSubLayers]
          : subLayers;
      wrapper.checkedSubLayers = leafs.reduce(toDictionary, {});

      this.checkedSubLayers = wrapper.checkedSubLayers;
      this.withChildren = wrapper.withChildren;
      this.checkedSubLayersTmp = clone(this.checkedSubLayers);
      wrapper.checkedSubLayersTmp = this.checkedSubLayersTmp;
      this.withChildrenTmp = clone(this.withChildren);
      wrapper.withChildrenTmp = this.withChildrenTmp;

      if (!this.HsLayerManagerService.currentLayer.visible) {
        for (const dict of [this.checkedSubLayersTmp, this.withChildrenTmp]) {
          Object.keys(dict).forEach((v) => (dict[v] = true));
        }
      }
    }
  }

  subLayerSelected(): void {
    const layer = this.HsLayerManagerService.currentLayer;
    const params = this.HsLayerUtilsService.getLayerParams(layer.layer);
    params.LAYERS = Object.keys(this.checkedSubLayers)
      .filter((key) => this.checkedSubLayers[key] && !this.withChildren[key])
      .join(',');
    if (this.HsLayerUtilsService.isLayerArcgis(layer.layer)) {
      params.LAYERS = `show:${params.LAYERS}`;
    }
    if (params.LAYERS == '' || params.LAYERS == 'show:') {
      this.HsLayerManagerService.changeLayerVisibility(!layer.visible, layer);
      return;
    }
    if (layer.visible == false) {
      this.HsLayerManagerService.changeLayerVisibility(!layer.visible, layer);
    }
    this.HsLayerUtilsService.updateLayerParams(layer.layer, params);
  }
}
