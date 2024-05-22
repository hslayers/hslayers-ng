import {Injectable} from '@angular/core';

import {Cluster, Vector as VectorSource} from 'ol/source';
import {Feature} from 'ol';
import {Vector as VectorLayer} from 'ol/layer';

import {HsAddDataOwsService} from 'hslayers-ng/services/add-data';
import {HsLayerManagerUtilsService} from './layer-manager-utils.service';
import {HsLayerSelectorService} from './layer-selector.service';
import {HsLayerUtilsService} from 'hslayers-ng/services/utils';
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

@Injectable({
  providedIn: 'root',
})
export class HsLayerManagerCopyLayerService {
  constructor(
    public hsLayerSelectorService: HsLayerSelectorService,
    public hsLayerUtilsService: HsLayerUtilsService,
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
    if (this.hsLayerUtilsService.isLayerVectorLayer(currentOlLayer)) {
      this.copyVectorLayer(copyTitle);
    } else {
      const url = this.hsLayerUtilsService.getURL(currentOlLayer);
      let name = getCachedCapabilities(currentOlLayer)?.Name;
      if (!name || typeof name === 'number') {
        name = getName(currentOlLayer);
      }
      const layerType =
        await this.hsLayerManagerUtilsService.getLayerSourceType(
          currentOlLayer,
        );
      const layerCopy = await this.hsAddDataOwsService.connectToOWS({
        type: layerType.toLowerCase(),
        uri: url,
        layer: name,
        getOnly: true,
      });
      if (layerCopy[0]) {
        layerCopy[0].setProperties(currentOlLayer.getProperties());
        setTitle(layerCopy[0], copyTitle);
        //Currently ticked sub-layers are stored in LAYERS
        const subLayers =
          this.hsLayerUtilsService.getLayerParams(currentOlLayer)?.LAYERS;
        if (subLayers) {
          setSubLayers(layerCopy[0], subLayers);
        }
        this.hsLayerUtilsService.updateLayerParams(
          layerCopy[0],
          this.hsLayerUtilsService.getLayerParams(currentOlLayer),
        );
        // We don't want the default styles to be set which add-data panel does.
        // Otherwise they won't be cleared if the original layer has undefined STYLES
        // Also we have to set LAYERS to currentLayer original values for composition saving
        this.hsLayerUtilsService.updateLayerParams(layerCopy[0], {
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
    if (this.hsLayerUtilsService.isLayerClustered(currentOlLayer)) {
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
      style: (currentOlLayer as VectorLayer<Feature>).getStyle(),
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
