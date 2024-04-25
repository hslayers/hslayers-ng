import {HsLayerDescriptor} from './layer-descriptor.interface';

export type HsLayermanagerFolder = {
  layers: HsLayerDescriptor[];
  zIndex: number;
  visible?: boolean;
};
