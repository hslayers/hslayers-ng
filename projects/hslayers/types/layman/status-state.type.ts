export const STATE_VALUES = [
  'PENDING',
  'STARTED',
  'FAILURE',
  'NOT_AVAILABLE',
] as const;

/**
 * Status information about GeoServer import and availability of WMS layer. No status object means the source is available.
 */
export type StatusStateType = (typeof STATE_VALUES)[number];
