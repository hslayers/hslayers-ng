import {HsAddDataLayerDescriptor} from '../../components/add-data/catalogue/layer-descriptor.model';

export enum EndpointErrorHandling {
  ignore = 'ignore',
  toast = 'toast',
}

export interface EndpointErrorHandler {
  // eslint-disable-next-line no-use-before-define
  handle(endpoint: HsEndpoint, error: any);
}

export interface HsEndpoint {
  httpCall?: any;
  type: string;
  title: string;
  url: string;
  download?: boolean;
  language?;
  listLoading?;
  layers?: HsAddDataLayerDescriptor[];
  originalConfiguredUser?;
  user?;
  authenticated?: boolean;
  code_list_url?: string;
  code_lists?;
  version?: string;
  datasourcePaging?: {
    start?: number;
    limit: number;
    loaded?: boolean;
    matched?;
    next?;
  };
  compositions?: any;
  compositionsPaging?: {
    start?: number;
    limit: number;
    next?;
    matched?;
    loaded?: boolean;
  };
  paging?: {
    itemsPerPage: number;
  };
  /**
   * Examples:
   *  onError: {compositionLoad: {handle: (e)=>{alert(e.message)}}},
   *  onError: onError: {compositionLoad: EndpointErrorHandling.ignore},
   *  onError: onError: {compositionLoad: EndpointErrorHandling.toast}, //Default
   */
  onError?: {
    compositionLoad?: EndpointErrorHandling | EndpointErrorHandler;
    addDataCatalogueLoad?: EndpointErrorHandling | EndpointErrorHandler;
  };
  getCurrentUserIfNeeded?(endpoint: HsEndpoint): Promise<void>;
}

function isErrorHandlerFunction(object: any): object is EndpointErrorHandler {
  if (typeof object == 'string' || object === undefined) {
    return false;
  }
  return 'handle' in object;
}

export {isErrorHandlerFunction};
