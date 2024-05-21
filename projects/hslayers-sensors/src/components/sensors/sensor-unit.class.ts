import {Feature} from 'ol';
import {Geometry} from 'ol/geom';
import {SenslogResponse} from './types/senslog-response.type';
import {SenslogSensor} from './types/senslog-sensor.type';

export type SensorTypes = {
  name: string;
  expanded?: boolean;
  sensors?: SenslogSensor[];
};

/**
 * expanded - Wether the list of sensors for this unit is visible or not
 */
export type HsSensorUnit = SenslogResponse & {
  expanded?: boolean;
  sensorTypes?: SensorTypes[];
  feature?: Feature<Geometry>;
};
