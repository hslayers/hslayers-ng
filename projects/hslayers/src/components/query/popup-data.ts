import {Feature, Map} from 'ol';
import {Geometry} from 'ol/geom';

import {HsFeatureLayer} from './query-popup.service.model';

export class HsQueryPopupData {
  map: Map;
  hoverPopup: any;
  featuresUnderMouse: Feature<Geometry>[] = [];
  featureLayersUnderMouse: HsFeatureLayer[] = [];
}
