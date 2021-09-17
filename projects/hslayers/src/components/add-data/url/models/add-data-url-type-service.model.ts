import {Group, Layer} from 'ol/layer';
import {Source} from 'ol/source';

import {CapabilitiesResponseWrapper} from '../../../../common/get-capabilities/capabilities-response-wrapper';
import {addDataUrlDataObject} from '../types/add-data-url-data-object.type';
import {addLayerOptions} from './../types/add-data-url-layer-options.type';
import {addLayersRecursivelyOptions} from './../types/add-data-url-recursive-options.type';

export interface HsAddDataUrlTypeServiceModel {
  data: addDataUrlDataObject;

  addLayerFromCapabilities(
    wrapper: CapabilitiesResponseWrapper,
    sld?: string
  ): Promise<void>;
  addLayers(checkedOnly: boolean, sld?: string): void;
  addLayer(layer: any, options: addLayerOptions): void;
  addLayersRecursively(layer: any, options: addLayersRecursivelyOptions): void;
  addService?(
    url: string,
    group: Group,
    layerName?: string,
    addUnder?: Layer<Source>,
    path?: string
  ): Promise<void>;
}
