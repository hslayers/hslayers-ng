import {Group, Layer} from 'ol/layer';
import {Source} from 'ol/source';

import {CapabilitiesResponseWrapper} from '../../../../common/get-capabilities/capabilities-response-wrapper';
import {addLayersRecursivelyOptions} from '../types/recursive-options.type';
import {layerOptions} from '../../../compositions/layer-parser/composition-layer-options.type';
import {urlDataObject} from '../types/data-object.type';

export type Service = {
  name: string;
  checked: boolean;
  type?: string;
};

export interface HsUrlTypeServiceModel {
  data: urlDataObject;
  setDataToDefault(): void;
  listLayerFromCapabilities(
    wrapper: CapabilitiesResponseWrapper,
    layerOptions?: layerOptions
  ): Promise<Layer<Source>[]>;
  getLayers(
    checkedOnly?: boolean,
    shallow?: boolean,
    layerOptions?: layerOptions
  ): Layer<Source>[] | Promise<Layer<Source>[]>;
  addLayers(layers: Layer<Source>[]): void;
  getLayer(
    layer: any,
    options: layerOptions
  ): Layer<Source> | Promise<Layer<Source>>;
  getLayersRecursively?(
    layer: any,
    options: addLayersRecursivelyOptions,
    collection: Layer<Source>[]
  ): void;
  expandService?(service: Service): void;
  addServices?(services: Service[]);
  isImageService?(): boolean;
  zoomToLayers?(): void;
  collapseServices?(): void;
}
