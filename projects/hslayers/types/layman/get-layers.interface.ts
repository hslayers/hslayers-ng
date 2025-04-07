import {HsLaymanLayerBase} from './layman-layer-base.interface';

export enum HsLaymanGetLayerWfsWmsStatus {
  AVAILABLE = 'AVAILABLE',
  PREPARING = 'PREPARING',
  NOT_AVAILABLE = 'NOT_AVAILABLE',
}

/**
 * Layer type for GET /layers response object
 * Extends base properties using HsLaymanLayerBase
 */
export interface HsLaymanGetLayer extends HsLaymanLayerBase {
  workspace?: string;
  publication_type?: string;
  wfs_wms_status?: HsLaymanGetLayerWfsWmsStatus;
}
