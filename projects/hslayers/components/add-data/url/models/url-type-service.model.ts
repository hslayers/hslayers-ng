import {Layer} from 'ol/layer';
import {Source} from 'ol/source';

import {AddLayersRecursivelyOptions} from '../types/recursive-options.type';
import {CapabilitiesResponseWrapper} from 'hslayers-ng/shared/get-capabilities';
import {LayerOptions} from 'hslayers-ng/common/types';
import {UrlDataObject} from '../types/data-object.type';

export type Service = {
  name: string;
  checked: boolean;
  type?: string;
};

export interface HsUrlTypeServiceModel {
  data: UrlDataObject;
  setDataToDefault(): void;
  listLayerFromCapabilities(
    wrapper: CapabilitiesResponseWrapper,
    layerOptions?: LayerOptions,
  ): Promise<Layer<Source>[]>;
  getLayers(
    checkedOnly?: boolean,
    shallow?: boolean,
    layerOptions?: LayerOptions,
  ): Layer<Source>[] | Promise<Layer<Source>[]>;
  addLayers(layers: Layer<Source>[]): void;
  getLayer(
    layer: any,
    options: LayerOptions,
  ): Layer<Source> | Promise<Layer<Source>>;
  getLayersRecursively?(
    layer: any,
    options: AddLayersRecursivelyOptions,
    collection: Layer<Source>[],
  ): void;
  expandService?(service: Service): void;
  addServices?(services: Service[]);
  isImageService?(): boolean;
  zoomToLayers?(): void;
  collapseServices?(): void;
  /**
   *  Side effect to be triggered on a layer being checked
   */
  tableLayerChecked?($event: MouseEvent, layer: any): void;
}
