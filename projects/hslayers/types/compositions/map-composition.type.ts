import {HslayersLayerJSON} from './layer-json.type';

export const compositionVersion = '3.0.0';

export interface TheUserSchema {
  email?: string;
  name?: string;
}
/**
 * Metadata contact of the organisation responsible for the creation and maintenance of the metadata
 */
export interface PointOfContact {
  person?: string;
  organization: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  email?: string;
  www?: string;
}

/**
 * The organisation responsible for the creation and maintenance of the metadata
 */
export interface ResponsibleOrganization {
  name: string;
  person?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  email?: string;
  www?: string;
}

export type CurrentBaseLayer = {
  title: string;
};

export type MapComposition = {
  describedBy?: string;
  schema_version?: string;
  abstract?: string;
  name?: string;
  title?: string;
  extent?: number[];
  nativeExtent?: number[];
  user?: TheUserSchema;
  contact?: PointOfContact;
  organization: ResponsibleOrganization;
  scale?: number;
  projection?: string;
  center?: number[];
  units?: string;
  layers?: HslayersLayerJSON[];
  current_base_layer?: CurrentBaseLayer;

  /**
   * HSL ONLY
   */
  keywords?: string;
};
