export type HsLaymanAccessRights = {
  read: string[];
  write: string[];
};

export type HsLaymanGeodataType = 'vector' | 'raster' | 'unknown';

export type HsLaymanGetWorkspaceLayerMap = {
  name: string;
  workspace: string;
};

/**
 * Properties common to both GET /layers and GET /layers/{id} responses
 */
export interface HsLaymanLayerBase {
  access_rights?: HsLaymanAccessRights;
  bounding_box?: number[];
  geodata_type?: HsLaymanGeodataType;
  name?: string;
  native_bounding_box?: number[];
  native_crs?: string;
  title?: string;
  uuid?: string;
  /** Top level service URL */
  url?: string;
  updated_at?: string;
  /**
   * List of compositions (maps) in which the layer is used
   */
  used_in_maps?: HsLaymanGetWorkspaceLayerMap[];
}
