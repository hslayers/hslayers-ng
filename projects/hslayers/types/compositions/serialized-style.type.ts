import {Color} from 'ol/color';
import {ColorLike, PatternDescriptor} from 'ol/colorlike';

import {SerializedImage} from './serialized-image.type';

export type SerializedStyle = {
  fill?: Color | ColorLike | PatternDescriptor;
  stroke?: {color: Color | ColorLike; width: number};
  image?: SerializedImage;
};
