import {Injectable} from '@angular/core';

import {HsLayerDescriptor} from '../layer-descriptor.interface';
import {HsLayerManagerService} from '../layermanager.service';
import {HsLayerSelectorService} from './layer-selector.service';
import {HsLayerUtilsService} from '../../utils/layer-utils.service';
import {getCachedCapabilities} from '../../../common/layer-extensions';

export type KeyBooleanDict = {
  [key: string]: boolean;
};

class HsLayerEditorSublayerParams {
  checkedSubLayers: KeyBooleanDict = {};
  withChildren: KeyBooleanDict = {};
  populatedLayers: Array<any> = [];
  withChildrenTmp: KeyBooleanDict = {};
  checkedSubLayersTmp: KeyBooleanDict = {};
}

@Injectable({
  providedIn: 'root',
})
export class HsLayerEditorSublayerService {
  apps: {
    [id: string]: HsLayerEditorSublayerParams;
  } = {default: new HsLayerEditorSublayerParams()};

  constructor(
    public HsLayerManagerService: HsLayerManagerService,
    public HsLayerSelectorService: HsLayerSelectorService,
    private HsLayerUtilsService: HsLayerUtilsService
  ) {
    this.HsLayerSelectorService.layerSelected.subscribe(({layer, app}) => {
      this.resetSublayers(layer, app);
    });
  }

  get(app: string): HsLayerEditorSublayerParams {
    if (this.apps[app ?? 'default'] == undefined) {
      this.apps[app ?? 'default'] = new HsLayerEditorSublayerParams();
    }
    return this.apps[app ?? 'default'];
  }

  resetSublayers(layer: HsLayerDescriptor, app: string) {
    const appRef = this.get(app);
    if (this.HsLayerManagerService.apps[app].currentLayer) {
      appRef.checkedSubLayers = layer.checkedSubLayers;
      appRef.checkedSubLayersTmp = layer.checkedSubLayersTmp;

      appRef.withChildren = layer.withChildren;
      appRef.withChildrenTmp = layer.withChildrenTmp;
    }
  }
  hasSubLayers(app: string): boolean {
    const subLayers = getCachedCapabilities(
      this.HsLayerManagerService.apps[app].currentLayer.layer
    )?.Layer;
    return subLayers != undefined && subLayers.length > 0;
  }

  getSubLayers(app: string) {
    if (this.HsLayerManagerService.apps[app].currentLayer === null) {
      return;
    }
    this.populateSubLayers(app);

    return (
      getCachedCapabilities(
        this.HsLayerManagerService.apps[app].currentLayer.layer
      )?.Layer || []
    );
  }

  populateSubLayers(app: string) {
    const appRef = this.get(app);
    const wrapper = this.HsLayerManagerService.apps[app].currentLayer;
    const layer = wrapper.layer;
    if (appRef.populatedLayers.includes(wrapper.uid)) {
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

      appRef.populatedLayers.push(wrapper.uid);
      const subLayersWithChild = subLayers.filter((sl) => sl.Layer);
      const subSubLayers = subLayersWithChild.map((sl) => sl.Layer).flat();
      wrapper.withChildren = subLayersWithChild.reduce(toDictionary, {});
      //List either 3rd level layers or second if no 3rd level layer exists
      const leafs = subSubLayers.length > 0 ? subSubLayers : subLayers;
      wrapper.checkedSubLayers = leafs.reduce(toDictionary, {});

      appRef.checkedSubLayers = wrapper.checkedSubLayers;
      appRef.withChildren = wrapper.withChildren;
      appRef.checkedSubLayersTmp = clone(appRef.checkedSubLayers);
      wrapper.checkedSubLayersTmp = appRef.checkedSubLayersTmp;
      appRef.withChildrenTmp = clone(appRef.withChildren);
      wrapper.withChildrenTmp = appRef.withChildrenTmp;

      if (!this.HsLayerManagerService.apps[app].currentLayer.visible) {
        for (const dict of [
          appRef.checkedSubLayersTmp,
          appRef.withChildrenTmp,
        ]) {
          Object.keys(dict).forEach((v) => (dict[v] = true));
        }
      }
    }
  }

  subLayerSelected(app: string): void {
    const appRef = this.get(app);
    const layer = this.HsLayerManagerService.apps[app].currentLayer;
    const params = this.HsLayerUtilsService.getLayerParams(layer.layer);
    params.LAYERS = Object.keys(appRef.checkedSubLayers)
      .filter(
        (key) => appRef.checkedSubLayers[key] && !appRef.withChildren[key]
      )
      .join(',');
    if (this.HsLayerUtilsService.isLayerArcgis(layer.layer)) {
      params.LAYERS = `show:${params.LAYERS}`;
    }
    if (params.LAYERS == '' || params.LAYERS == 'show:') {
      this.HsLayerManagerService.changeLayerVisibility(
        !layer.visible,
        layer,
        app
      );
      return;
    }
    if (layer.visible == false) {
      this.HsLayerManagerService.changeLayerVisibility(
        !layer.visible,
        layer,
        app
      );
    }
    this.HsLayerUtilsService.updateLayerParams(layer.layer, params);
  }
}
