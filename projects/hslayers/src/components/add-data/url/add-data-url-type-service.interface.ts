import {Group, Layer} from 'ol/layer';
import {Source} from 'ol/source';

import {CapabilitiesResponseWrapper} from '../../../common/get-capabilities/capabilities-response-wrapper';

export type addLayerOptions = {
  layerName?: string;
  path?: string;
  imageFormat?: string;
  queryFormat?: string;
  crs?: string;
  subLayers?: any[];
  layerTitle?: string;
  tileSize?;
  folder?: string;
  sld?: string;
};

export type addLayersRecursivelyOptions = {
  checkedOnly?: boolean;
  sld?: string;
};

export interface HsAddDataUrlTypeServiceInterface {
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
  srsChanged?(): void;
  createBasemapName?(data: any): string;
  getSublayerNames?(layer: any): any[];
  addService?(
    url: string,
    group: Group,
    layerName?: string,
    addUnder?: Layer<Source>,
    path?: string
  ): Promise<void>;
}
