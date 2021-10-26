import {DataSource, ImageryLayer} from 'cesium';

export class OlCesiumObjectMapItem {
  olObject: any;
  csObject: ImageryLayer | DataSource;
}
