import {IntersectWithTooltip} from '../type-intersection.type';
import {LayerOptions} from '../compositions/composition-layer-options.type';

export type LayerConnection = {
  owrCache?: boolean;
  getOnly?: boolean;
  layerOptions?: LayerOptions;
};

export type OwsType = {
  layer?: string;
  type?: string;
  uri?: string;
};

export type OwsConnection = IntersectWithTooltip<
  Partial<OwsType> & LayerConnection
>;
