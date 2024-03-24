import {Color} from 'ol/color';
import {ColorLike, PatternDescriptor} from 'ol/colorlike';

export type SerializedImage = {
  fill?: Color | ColorLike | PatternDescriptor;
  stroke?: {color: Color | ColorLike; width: number};
  radius?: number;
  src?: string;
  type?: string;
};
