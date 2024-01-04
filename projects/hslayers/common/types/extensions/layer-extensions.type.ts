export type Attribution = {
  onlineResource?: string;
  title?: string;
  logoUrl?: {
    format?: string;
    onlineResource?: string;
  };
  /**
   * If set to true even if get capabilities receives some attribution,
   * it will not be updated and existing hardcoded attribution will be used
   */
  locked?: boolean;
};
export type Definition = {
  format?: string;
  url?: string;
};
export type Editor = {
  editable?: boolean;
  /**
   * Object of key value pairs where key is the attribute name and value
   * is the default attribute value to set
   */
  defaultAttributes?: any;
};
export type popUpAttribute = {
  attribute: string;
  displayFunction?: any;
  label?: string;
};
export type popUp = {
  attributes?: Array<popUpAttribute | string>;
  widgets?: string[];
  displayFunction?: any;
};

export interface Dimension {
  label: string;
  onlyInEditor?: boolean;
  type?: 'datetime' | 'date';
  value?: any;
  default?: any;
  units?: string;
  /**
   * Can be represented either by an array of values or, in case of time, as a ISO8601 time definition
   */
  values?: any[] | string;
  availability?(): boolean;
}

export interface DimensionsList {
  [key: string]: Dimension;
}

export type MetadataUrl = {
  type?: string;
  format?: string;
  onlineResource?: string;
};

export type Metadata = {
  id?: string | number;
  urls?: MetadataUrl[];
  styles?: any;
};
