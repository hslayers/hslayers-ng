import {
  PointOfContact,
  ResponsibleOrganization,
  TheUserSchema,
} from './map-composition.type';

export type UserData = {
  user?: TheUserSchema;
  contact?: PointOfContact;
  organization?: ResponsibleOrganization;
};
