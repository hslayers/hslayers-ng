import {Group, Layer} from 'ol/layer';
import {Source} from 'ol/source';

import {CapabilitiesResponseWrapper} from '../../../../common/get-capabilities/capabilities-response-wrapper';
import {addLayerOptions} from './../types/add-data-url-layer-options.type';
import {addLayersRecursivelyOptions} from './../types/add-data-url-recursive-options.type';

export interface HsAddDataUrlTypeServiceModel {
  data: any;
  url: string;
  showDetails: boolean;
  loadingInfo: boolean;
  layerToSelect: string;

  addLayerFromCapabilities(
    wrapper: CapabilitiesResponseWrapper,
    sld?: string
  ): Promise<void>;
  throwParsingError(e: any): void;
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
