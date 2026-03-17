import Feature from 'ol/Feature';
import Geometry from 'ol/geom/Geometry';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import {ReplaySubject} from 'rxjs';

import {HsPanelItem} from 'hslayers-ng/common/panels';
import {HsQueryPopupData} from './popup-data';

export type HsFeatureLayer = {
  title: string;
  features: Feature<Geometry>[];
  layer: VectorLayer<VectorSource<Feature>>;
  panelObserver: ReplaySubject<HsPanelItem>;
};

export interface HsQueryPopupServiceModel extends HsQueryPopupData {
  registerPopup(nativeElement: any);
  fillFeatures(features: Feature<Geometry>[]);
  showPopup(e: any): void;
  closePopup(): void;
  serializeFeatureAttributes(feature: Feature<Geometry>): any[];
}
