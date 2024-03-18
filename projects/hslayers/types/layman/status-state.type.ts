export const STATE_VALUES = [
  'PENDING',
  'STARTED',
  'FAILURE',
  'NOT_AVAILABLE',
] as const;

export type StatusStateType = (typeof STATE_VALUES)[number];
