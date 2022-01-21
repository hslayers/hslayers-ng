export const filesSupported = [
  'kml',
  'gpx',
  'geojson',
  'shp',
  'rasterImages',
] as const;
export type AddDataFileType = typeof filesSupported[number];
//https://stackoverflow.com/questions/40863488/how-can-i-iterate-over-a-custom-literal-type-in-typescript
