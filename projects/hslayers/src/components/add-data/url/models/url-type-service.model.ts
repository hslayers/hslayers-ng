import {Group, Layer} from 'ol/layer';
import {Source} from 'ol/source';

import {CapabilitiesResponseWrapper} from '../../../../common/get-capabilities/capabilities-response-wrapper';
import {addLayerOptions} from '../types/layer-options.type';
import {addLayersRecursivelyOptions} from '../types/recursive-options.type';
import {urlDataObject} from '../types/data-object.type';

export interface HsUrlTypeServiceModel {
  data: urlDataObject;

  listLayerFromCapabilities(
    wrapper: CapabilitiesResponseWrapper,
    sld?: string
  ): Promise<Layer<Source>[]>;
  addLayers(checkedOnly: boolean, style?: string): Layer<Source>[];
  addLayer(layer: any, options: addLayerOptions): Layer<Source>;
  addLayersRecursively(
    layer: any,
    options: addLayersRecursivelyOptions,
    collection: Layer<Source>[]
  ): void;
  addService?(params: any): void;
  setDataToDefault(): void;
}
