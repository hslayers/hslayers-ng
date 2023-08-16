export const StateValues = [
  'PENDING',
  'STARTED',
  'FAILURE',
  'NOT_AVAILABLE',
] as const;

export type StatusStateType = (typeof StateValues)[number];
