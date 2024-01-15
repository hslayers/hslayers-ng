import {Color} from 'ol/color';
import {ColorLike} from 'ol/colorlike';

import {SerializedImage} from './serialized-image.type';

export type SerializedStyle = {
  fill?: Color | ColorLike;
  stroke?: {color: Color | ColorLike; width: number};
  image?: SerializedImage;
};
