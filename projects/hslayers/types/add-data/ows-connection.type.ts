import {AddDataUrlType} from './url.type';
import {IntersectWithTooltip} from '../type-intersection.type';
import {LayerOptions} from '../compositions/composition-layer-options.type';
import {WhatToAddDescriptor} from './whatToAddDescriptor';

export type LayerConnection = {
  owrCache?: boolean;
  getOnly?: boolean;
  layerOptions?: LayerOptions;
  /***
   * Optional parameter which prevents default layer creation via getCapabilities
   * and uses layman layer descriptor instead
   */
  laymanLayer?: WhatToAddDescriptor<string>;
};

export type OwsType = {
  type?: AddDataUrlType;
  uri?: string;
  layer?: OwsType['type'] extends 'arcgis' ? string | string[] : string;
};

export type OwsConnection = IntersectWithTooltip<
  Partial<OwsType> & LayerConnection
>;
