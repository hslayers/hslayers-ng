import {IntersectWithTooltip} from 'hslayers-ng/common/types';
import {LayerOptions} from 'hslayers-ng/components/compositions';

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
