import {ImprintObj} from './imprint-object.model';
import {LegendObj} from './legend-object.model';
import {ScaleObj} from './scale-object.model';
import {TitleObj} from './title-object.model';

export type PrintModel = {
  titleObj?: TitleObj;
  scaleObj?: ScaleObj;
  legendObj?: LegendObj;
  imprintObj?: ImprintObj;
};
