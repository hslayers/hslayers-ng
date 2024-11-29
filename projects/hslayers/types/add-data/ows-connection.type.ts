import {AddDataUrlType} from './url.type';
import {IntersectWithTooltip} from '../type-intersection.type';
import {LayerOptions} from '../compositions/composition-layer-options.type';

export type LayerConnection = {
  owrCache?: boolean;
  getOnly?: boolean;
  layerOptions?: LayerOptions;
};

export type OwsType = {
  type?: AddDataUrlType;
  uri?: string;
  layer?: OwsType['type'] extends 'arcgis' ? string | string[] : string;
};

export type OwsConnection = IntersectWithTooltip<
  Partial<OwsType> & LayerConnection
>;
