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
  ): Promise<Layer<Source, any>[]>;
  addLayers(checkedOnly: boolean, style?: string): Layer<Source, any>[];
  addLayer(layer: any, options: addLayerOptions): Layer<Source, any>;
  addLayersRecursively(
    layer: any,
    options: addLayersRecursivelyOptions,
    collection: Layer<Source, any>[]
  ): void;
  addService?(params: any): Promise<void>;
  setDataToDefault(): void;
}
