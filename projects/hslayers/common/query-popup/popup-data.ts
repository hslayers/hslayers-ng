import Feature from 'ol/Feature';
import Geometry from 'ol/geom/Geometry';
import Map from 'ol/Map';

import {HsFeatureLayer} from './query-popup.service.model';

export class HsQueryPopupData {
  map: Map;
  hoverPopup: any;
  featuresUnderMouse: Feature<Geometry>[] = [];
  featureLayersUnderMouse: HsFeatureLayer[] = [];
}
