import { StatusStateType } from './status-state.type';


export type LaymanGetWorkspaceLayerTime = {
  units: string;
  values: string[];
  default: string;
  regex: string;
  regex_format: string;
};

export type LaymanGetWorkspaceLayerTypeResponse = {
  url?: string;
  status?: StatusStateType;
  error?: any;
  name?: string;
};

export type LaymanGetWorkspaceLayerTypeWms = LaymanGetWorkspaceLayerTypeResponse
export type LaymanGetWorkspaceLayerTypeWfs = LaymanGetWorkspaceLayerTypeResponse & {
  /**
 * Available only for time-series layers
 */
  time?: LaymanGetWorkspaceLayerTime;
};

export type LaymanGetWorkspaceLayerMap = {
  name: string;
  workspace: string;
};

export interface HsLaymanLayerDescriptor {
  name?: string;
  uuid?: string;
  layman_metadata?: {
    publication_status: 'COMPLETE' | 'INCOMPLETE' | 'UPDATING';
  };
  url?: string;
  title?: string;
  description?: string;
  updated_at?: string;

  wms?: LaymanGetWorkspaceLayerTypeWms;
  wfs?: LaymanGetWorkspaceLayerTypeWfs;
  thumbnail?: {
    path?: string;
    url?: string;
    status?: StatusStateType;
    error?: any;
  };
  file?: {
    /**
     * If data file was sent in ZIP archive to the server, path includes also path to the main file inside ZIP file. 
     * E.g. layers/b8a6c133-3363-4343-8a25-978d0df52c11/input_file/b8a6c133-3363-4343-8a25-978d0df52c11.zip/layer_main_file.shp
     */
    paths?: string[];
    status?: StatusStateType;
    error?: {
      code?: number;
      message?: string;
      detail?: any;
    };
  };
  /**
   * Available only for vector layers
   */
  db?: {
    schema?: string;
    table?: string;
    geo_column?: string;
    external_uri?: string;
    status?: StatusStateType;
    error?: any;
  };
  style?: {
    url?: string;
    type?: string;
    status?: StatusStateType;
    error?: any;
  };
  original_data_source: 'file' | 'database_table';
  metadata?: {
    identifier?: string;
    record_url?: string;
    csw_url?: string;
    comparison_url?: string;
    status?: StatusStateType;
    error?: any;
  };
  access_rights?: {
    read: string[];
    write: string[];
  };
  bounding_box?: number[];
  native_crs?: any;
  native_bounding_box?: number[];
  /**
   * True for raster layers using image_mosaic plugin in GeoServer, so far only timeseries layers.
   */
  image_mosaic: boolean;
  /**
   * Type of the layer
   */
  geodata_type: 'vector' | 'raster' | 'unknown';
  /**
* List of compositions (maps) in which the layer is used
*/
  used_in_maps?: LaymanGetWorkspaceLayerMap[];

  exists?: boolean;
  /**
   * Only when error
   */
  message?: string;
  /**
   * Only when error
   */
  detail?: string;
  /**
   * Only when error
   */
  code?: number;
  /**
   * Only when error
   */
  sub_code?: number;
  /**
   * Not part of original response. Added by describeLayer
   */
  workspace?: string;

}
