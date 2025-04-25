import {AddDataUrlType} from './url.type';
import {IntersectWithTooltip} from '../type-intersection.type';
import {LayerOptions} from '../compositions/composition-layer-options.type';
import {WhatToAddDescriptor} from './whatToAddDescriptor';
import {UrlDataObject} from './data-object.type';

export type LayerConnection = {
  owrCache?: boolean;
  getOnly?: boolean;
  layerOptions?: LayerOptions;
  /**
   * Specific connection options used when adding layers fron Layman or from compositions
   * Basically to set properties of DATA object of the corresponding type service
   * NOTE: We can populate this with params that are normally (via catalogue or URL) not used or set by user.
   */
  connectOptions?: Partial<UrlDataObject> & {
    /***
     * Optional parameter which prevents default layer creation via getCapabilities
     * and uses layman layer descriptor instead
     */
    laymanLayer?: WhatToAddDescriptor<string>;
  };
};

export type OwsType = {
  type?: AddDataUrlType;
  uri?: string;
  layer?: OwsType['type'] extends 'arcgis' ? string | string[] : string;
};

export type OwsConnection = IntersectWithTooltip<
  Partial<OwsType> & LayerConnection
>;
