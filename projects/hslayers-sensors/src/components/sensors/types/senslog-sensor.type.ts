export class SenslogSensor {
  phenomenon_name: string;
  sensor_id: string | number;
  sensor_name: string;
  sensor_type: string;
  uom: string;
  unit_id: number;
  unit_description: string;
  lastObservationTimestamp?: string;
  lastObservationValue?: string;
  checked: boolean;
}
