import {xPos, yPos} from './xy-positions.type';

export type TextStyle = {
  textColor?: string;
  bcColor?: string;
  textSize?: string;
  fontFamily?: string;
  fontStyle?: string;
  textDraw?: 'fill' | 'stroke';
  posX?: xPos;
  posY?: yPos;
};
