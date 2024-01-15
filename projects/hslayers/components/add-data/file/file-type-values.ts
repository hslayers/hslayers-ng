import {AddDataFileType} from 'hslayers-ng/types';

export const AddDataFileValues: Array<{id: AddDataFileType; text: string}> = [
  {
    id: 'kml',
    text: 'KML',
  },
  {
    id: 'gpx',
    text: 'GPX',
  },
  {
    id: 'geojson',
    text: 'GeoJSON',
  },
  {
    id: 'shp',
    text: 'Shapefile',
  },
  {
    id: 'raster',
    text: 'Raster image',
  },
  {
    id: 'raster-ts',
    text: 'Raster time series',
  },
];
