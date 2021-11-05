import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import {Feature} from 'ol';
import {Geometry} from 'ol/geom';
import {ReplaySubject} from 'rxjs';

import {HsPanelItem} from '../layout/panels/panel-item';

export type HsFeatureLayer = {
  title: string;
  feature: Feature<Geometry>[];
  layer: VectorLayer<VectorSource<Geometry>>;
  panelObserver: ReplaySubject<HsPanelItem>;
};

export interface HsQueryPopupServiceModel {
  registerPopup(nativeElement: any);
  featuresUnderMouse: Feature<Geometry>[];
  featureLayersUnderMouse: HsFeatureLayer[];
  hoverPopup: any;

  fillFeatures(features: Feature<Geometry>[]);
  showPopup(e: any): void;
  closePopup(): void;
  serializeFeatureAttributes(feature: Feature<Geometry>): any[];
}

