import {GeoJSONFeatureCollection} from 'ol/format/GeoJSON';

import {
  Attribution,
  DimensionsList,
  Metadata,
} from '../extensions/layer-extensions.type';
import {LayerSwipeSide} from '../map-swipe.type';
import {SerializedStyle} from './serialized-style.type';

type Opacity = string | number;
type legacyClassname = 'HSLayers.Layer.WMS' | 'HSLayers.Layer.WMTS';

export type Classname =
  | legacyClassname
  | 'WMS'
  | 'WMTS'
  | 'Vector'
  | 'XYZ'
  | 'ArcGISRest'
  | 'StaticImage';

type legacyLayerProcolFormat =
  | 'hs.format.externalWFS'
  | 'ol.format.KML'
  | 'ol.format.GeoJSON'
  | 'ol.format.GPX'
  | 'ol.format.Sparql';

export type LayerProcolFormat =
  | legacyLayerProcolFormat
  | 'KML'
  | 'GeoJSON'
  | 'GPX'
  | 'WFS'
  | 'externalWFS'
  | 'Sparql';

/**
 * Protocol in map composition scheme
 * Definition for vector layers
 * Layer without URL is not synchronized
 */
export type Definition = {url?: string; format: LayerProcolFormat};

interface TheParamsSchema {
  LAYERS?: string;
  FORMAT?: string;
  VERSION?: string;
  STYLES?: string;
}

export type LayerJSON = {
  metadata?: Metadata;
  visibility?: boolean;
  base?: boolean;
  opacity?: Opacity;
  path?: string;
  title?: string;
  className?: Classname;
  singleTile?: boolean;
  greyscale?: boolean;
  displayInLayerSwitcher?: boolean;
  wmsMaxScale?: number; //Deprecated
  legends?: string | string[];
  protocol?: Definition;
  attributions?: Attribution;
  features?: GeoJSONFeatureCollection | string;
  maxResolution?: number;
  minResolution?: number;
  url?: string;
  params?: TheParamsSchema;
  ratio?: number;
  projection?: string;
  style?: SerializedStyle | string;
  dimensions?: DimensionsList;
  workspace?: string;
};

export type HslayersLayerJSON = LayerJSON & {
  extent?: number[];
  layer?: string;
  subLayers?: string;
  matrixSet?: string;
  format?: string;
  info_format?: string;
  swipeSide?: LayerSwipeSide;
  name?: string;
  maxExtent?: {
    left: number;
    bottom: number;
    right: number;
    top: number;
  };
};
