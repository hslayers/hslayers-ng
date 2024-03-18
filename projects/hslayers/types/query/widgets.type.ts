export const QUERY_POPUP_WIDGETS = [
  'layer-name',
  'feature-info',
  'clear-layer',
] as const;
export type QueryPopupWidgetsType = (typeof QUERY_POPUP_WIDGETS)[number];
