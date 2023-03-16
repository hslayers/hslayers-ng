import {Layer} from 'ol/layer';
import {Source} from 'ol/source';

export type urlDataObject = {
  add_all?: boolean;
  add_under?: Layer<Source>;
  base?: boolean;
  bbox?: string;
  caps?: any;
  description?: string;
  exceptions?: {Format: string | Array<string>};
  extent?: any;
  folder_name?: string;
  get_map_url?: string;
  image_format?: string;
  image_formats?: Array<string>;
  layers?: Array<any>;
  map_projection?: string;
  output_format?: string;
  output_formats?: Array<string>;
  query_format?: string;
  query_formats?: Array<string>;
  register_metadata?: boolean;
  resample_warning?: boolean;
  services?: Array<any>;
  /**
   * Control for ArcGIS table UI
   */
  serviceExpanded?: boolean;
  srs?: string;
  srss?: Array<any>;
  tile_size?: number;
  title?: string;
  use_resampling?: boolean;
  use_tiles?: boolean;
  version?: string;
  visible?: boolean;
  table: {
    trackBy: string;
    nameProperty: string;
  };
};
