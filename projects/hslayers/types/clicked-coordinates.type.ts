import {Coordinate} from 'ol/coordinate';

export type ClickedCoordinates = {
  coordinates: {
    name: string;
    mapProjCoordinate: Coordinate;
    epsg4326Coordinate: Coordinate;
    projections: {name: string; value: any}[];
  };
};
