import {Color} from 'ol/color';
import {ColorLike} from 'ol/colorlike';

export type SerializedImage = {
  fill?: Color | ColorLike;
  stroke?: {color: Color | ColorLike; width: number};
  radius?: number;
  src?: string;
  type?: string;
};
