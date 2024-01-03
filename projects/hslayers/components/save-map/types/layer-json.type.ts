import {GeoJSONFeatureCollection} from 'ol/format/GeoJSON';

import {
  Attribution,
  DimensionsList,
  Metadata,
} from 'hslayers-ng/common/extensions';
import {SerializedStyle} from './serialized-style.type';

export type LayerJSON = {
  metadata?: Metadata;
  visibility?: boolean;
  swipeSide?: string;
  opacity?: number;
  base?: boolean;
  title?: string;
  name?: string;
  path?: string;
  maxExtent?: {
    left: number;
    bottom: number;
    right: number;
    top: number;
  };
  maxResolution?: number;
  minResolution?: number;
  displayInLayerSwitcher?: boolean;
  dimensions?: DimensionsList;
  className?: string;
  singleTile?: boolean;
  extent?: number[];
  legends?: string | string[];
  projection?: string;
  params?: any;
  layer?: string;
  subLayers?: string;
  url?: string;
  attributions?: Attribution;
  matrixSet?: string;
  format?: string;
  info_format?: string;
  protocol?: {url: string; format: string};
  workspace?: string;
  features?: GeoJSONFeatureCollection | string;
  style?: SerializedStyle | string;
  greyscale?: boolean;
};
