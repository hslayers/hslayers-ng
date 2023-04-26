import {IntersectWithTooltip} from '../../../../common/type-intersection.type';
import {layerOptions} from '../../../compositions/layer-parser/composition-layer-params.type';

export type layerConnection = {
  owrCache?: boolean;
  getOnly?: boolean;
  layerOptions?: layerOptions;
};

export type owsType = {
  layer?: string;
  type?: string;
  uri?: string;
};

export type owsConnection = IntersectWithTooltip<
  Partial<owsType> & layerConnection
>;
