import {LayerJSON} from './layer-json.type';
import {UserData} from './user-data.type';

export type MapComposition = {
  abstract?: string;
  title?: string;
  keywords?: string;
  nativeExtent?: number[];
  extent?: number[];
  user?: UserData;
  describedBy?: string;
  schema_version?: string;
  groups?: any;
  scale?: number;
  projection?: string;
  center?: number[];
  units?: string;
  maxExtent?: {
    left?: number;
    bottom?: number;
    right?: number;
    top?: number;
  };
  layers?: LayerJSON[];
  current_base_layer?: {
    title: string;
  };
};
