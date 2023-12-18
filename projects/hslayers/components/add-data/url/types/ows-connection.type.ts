import {IntersectWithTooltip} from '../../../../common/type-intersection.type';
import {LayerOptions} from '../../../compositions/layer-parser/composition-layer-options.type';

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
