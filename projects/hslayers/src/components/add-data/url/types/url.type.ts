export const servicesSupportedByUrl = [
  'wms',
  'wfs',
  'wmts',
  'kml',
  'gpx',
  'geojson',
  'arcgis',
] as const;
export type AddDataUrlType = typeof servicesSupportedByUrl[number];
//https://stackoverflow.com/questions/40863488/how-can-i-iterate-over-a-custom-literal-type-in-typescript
