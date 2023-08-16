export const queryPopupWidgets = [
  'layer-name',
  'feature-info',
  'clear-layer',
] as const;
export type QueryPopupWidgetsType = (typeof queryPopupWidgets)[number];
