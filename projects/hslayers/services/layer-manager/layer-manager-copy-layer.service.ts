import {Injectable} from '@angular/core';

import {Cluster, Vector as VectorSource} from 'ol/source';
import {Feature} from 'ol';
import {Vector as VectorLayer} from 'ol/layer';

import {HsAddDataOwsService} from 'hslayers-ng/services/add-data';
import {HsLayerManagerUtilsService} from './layer-manager-utils.service';
import {HsLayerSelectorService} from './layer-selector.service';
import {HsMapService} from 'hslayers-ng/services/map';
import {
  getCachedCapabilities,
  getName,
  getOrigLayers,
  getTitle,
  setName,
  setSubLayers,
  setTitle,
} from 'hslayers-ng/common/extensions';
import {
  getURL,
  isLayerVectorLayer,
  getLayerParams,
  updateLayerParams,
  isLayerClustered,
} from 'hslayers-ng/services/utils';

@Injectable({
  providedIn: 'root',
})
export class HsLayerManagerCopyLayerService {
  constructor(
    public hsLayerSelectorService: HsLayerSelectorService,
    public hsMapService: HsMapService,
    public hsAddDataOwsService: HsAddDataOwsService,
    private hsLayerManagerUtilsService: HsLayerManagerUtilsService,
  ) {}

  /**
    Creates a copy of the currentLayer
   */
  async copyLayer(newTitle: string): Promise<void> {
    const copyTitle = this.createCopyTitle(newTitle);
    const currentOlLayer = this.hsLayerSelectorService.currentLayer.layer;
    if (isLayerVectorLayer(currentOlLayer)) {
      this.copyVectorLayer(copyTitle);
    } else {
      const url = getURL(currentOlLayer);
      let name = getCachedCapabilities(currentOlLayer)?.Name;
      if (!name || typeof name === 'number') {
        name = getName(currentOlLayer);
      }
      const layerType =
        await this.hsLayerManagerUtilsService.getLayerSourceType(
          currentOlLayer,
        );
      const layerCopy = await this.hsAddDataOwsService.connectToOWS({
        type: layerType.toLowerCase() as any,
        uri: url,
        layer: name,
        getOnly: true,
      });
      if (layerCopy[0]) {
        layerCopy[0].setProperties(currentOlLayer.getProperties());
        setTitle(layerCopy[0], copyTitle);
        //Currently ticked sub-layers are stored in LAYERS
        const subLayers = getLayerParams(currentOlLayer)?.LAYERS;
        if (subLayers) {
          setSubLayers(layerCopy[0], subLayers);
        }
        updateLayerParams(layerCopy[0], getLayerParams(currentOlLayer));
        // We don't want the default styles to be set which add-data panel does.
        // Otherwise they won't be cleared if the original layer has undefined STYLES
        // Also we have to set LAYERS to currentLayer original values for composition saving
        updateLayerParams(layerCopy[0], {
          STYLES: null,
          //Object.assign will ignore it if origLayers is undefined.
          LAYERS: getOrigLayers(currentOlLayer),
        });
        this.hsMapService.getMap().addLayer(layerCopy[0]);
      }
    }
  }

  /**
    Creates a copy of the currentLayer if it is a vector layer
   */
  copyVectorLayer(newTitle: string): void {
    let features;
    const currentOlLayer = this.hsLayerSelectorService.currentLayer.layer;
    if (isLayerClustered(currentOlLayer)) {
      features = (currentOlLayer.getSource() as Cluster<Feature>)
        .getSource()
        ?.getFeatures();
    } else {
      features = (currentOlLayer.getSource() as VectorSource)?.getFeatures();
    }

    const copiedLayer = new VectorLayer({
      properties: currentOlLayer.getProperties(),
      source: new VectorSource({
        features,
      }),
      style: (currentOlLayer as VectorLayer<VectorSource<Feature>>).getStyle(),
    });
    setTitle(copiedLayer, newTitle);
    setName(copiedLayer, getName(currentOlLayer));
    this.hsMapService.addLayer(copiedLayer);
  }

  /**
    Creates a new title for the copied layer
   */
  createCopyTitle(newTitle: string): string {
    const layerName = getName(this.hsLayerSelectorService.currentLayer.layer);
    let copyTitle = getTitle(this.hsLayerSelectorService.currentLayer.layer);
    let numb = 0;
    if (newTitle && newTitle !== copyTitle) {
      copyTitle = newTitle;
    } else {
      const layerCopies = this.hsMapService
        .getLayersArray()
        .filter((l) => getName(l) == layerName);
      numb = layerCopies !== undefined ? layerCopies.length : 0;
      copyTitle = copyTitle.replace(/\([0-9]\)/g, '').trimEnd();
      copyTitle = copyTitle + ` (${numb})`;
    }
    return copyTitle;
  }
}
