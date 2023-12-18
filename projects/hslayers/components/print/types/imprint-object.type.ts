import {TextStyle} from './text-style.type';

export type ImprintObj = {
  include?: boolean;
  author?: string;
  width?: number;
  height?: number;
  abstract?: string;
  textStyle?: TextStyle;
};
