import {xPos, yPos} from '../types/XY-positions.type';

export type TextStyle = {
  fillColor?: string;
  strokeColor?: string;
  textSize?: string;
  fontFamily?: string;
  fontStyle?: string;
  textDraw?: 'fill' | 'stroke';
  posX?: xPos;
  posY?: yPos;
};
