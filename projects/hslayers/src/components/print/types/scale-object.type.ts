import {Units} from 'ol/control/ScaleLine';

export type ScaleObj = {
  include?: boolean;
  scaleType?: 'scaleline' | 'scalebar';
  scaleBarSteps?: number;
  scaleBarText?: boolean;
  scaleUnits?: Units;
};
