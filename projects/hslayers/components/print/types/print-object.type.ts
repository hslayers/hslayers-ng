import {ImprintObj} from './imprint-object.type';
import {LegendObj} from './legend-object.type';
import {ScaleObj} from './scale-object.type';
import {TitleObj} from './title-object.type';

export type PrintModel = {
  titleObj?: TitleObj;
  scaleObj?: ScaleObj;
  legendObj?: LegendObj;
  imprintObj?: ImprintObj;
};
