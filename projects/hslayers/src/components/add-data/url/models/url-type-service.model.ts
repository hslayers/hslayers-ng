import {Group, Layer} from 'ol/layer';
import {Source} from 'ol/source';

import {CapabilitiesResponseWrapper} from '../../../../common/get-capabilities/capabilities-response-wrapper';
import {addLayerOptions} from '../types/layer-options.type';
import {addLayersRecursivelyOptions} from '../types/recursive-options.type';
import {urlDataObject} from '../types/data-object.type';

export type Service = {
  name: string;
  checked: boolean;
  type?: string;
};

export interface HsUrlTypeServiceModel {
  data: urlDataObject;

  listLayerFromCapabilities(
    wrapper: CapabilitiesResponseWrapper,
    sld?: string
  ): Promise<Layer<Source>[]>;
  getLayers(
    app: string,
    checkedOnly?: boolean,
    style?: string
  ): Layer<Source>[];
  addLayers(layers: Layer<Source>[], app: string): void;
  getLayer(layer: any, options: addLayerOptions, app: string): Layer<Source>;
  getLayersRecursively?(
    layer: any,
    options: addLayersRecursivelyOptions,
    collection: Layer<Source>[],
    app: string
  ): void;
  expandService?(service: Service, app: string): void;
  addServices?(services: Service[], app: string);
  setDataToDefault(): void;
  isImageService?(): boolean;
}
