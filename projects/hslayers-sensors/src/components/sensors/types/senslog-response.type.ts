import {SenslogSensor} from './senslog-sensor.type';

/**
 * @example
 * asWKT :  "POINT(16.7336889 48.8248517)"
 * time_stamp: "2024-04-19 13:00:00+02"
 */
export type UnitPosition = {
  asWKT: string;
  time_stamp: string;
};

export type SenslogResponse = {
  description: string;
  is_mobile: boolean;
  sensors: SenslogSensor[];
  unit_id: number;
  unit_position: UnitPosition;
  unit_type: string;
};
