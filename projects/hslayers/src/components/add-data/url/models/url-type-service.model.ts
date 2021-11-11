import {Group, Layer} from 'ol/layer';
import {Source} from 'ol/source';

import {CapabilitiesResponseWrapper} from '../../../../common/get-capabilities/capabilities-response-wrapper';
import {addLayerOptions} from '../types/layer-options.type';
import {addLayersRecursivelyOptions} from '../types/recursive-options.type';
import {urlDataObject} from '../types/data-object.type';

export interface HsUrlTypeServiceModel {
  data: urlDataObject;

  addLayerFromCapabilities(
    wrapper: CapabilitiesResponseWrapper,
    sld?: string
  ): Promise<void>;
  addLayers(checkedOnly: boolean, style?: string): void;
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
