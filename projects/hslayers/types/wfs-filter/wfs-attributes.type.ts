export interface WfsFeatureAttribute {
  name: string;
  type: string;
  isNumeric: boolean;
  values?: string[] | number[];
  range?: {min: number; max: number};
}
