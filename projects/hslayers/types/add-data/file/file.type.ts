export const FILES_SUPPORTED = [
  'kml',
  'gpx',
  'geojson',
  'shp',
  'raster',
  'raster-ts',
] as const;
export type AddDataFileType = (typeof FILES_SUPPORTED)[number];
//https://stackoverflow.com/questions/40863488/how-can-i-iterate-over-a-custom-literal-type-in-typescript
