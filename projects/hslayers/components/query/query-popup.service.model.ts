import {Feature} from 'ol';
import {Geometry} from 'ol/geom';
import {ReplaySubject} from 'rxjs';
import {Vector as VectorLayer} from 'ol/layer';
import {Vector as VectorSource} from 'ol/source';

import {HsPanelItem} from '../layout/panels/panel-item';
import {HsQueryPopupData} from './popup-data';

export type HsFeatureLayer = {
  title: string;
  feature: Feature<Geometry>[];
  layer: VectorLayer<VectorSource>;
  panelObserver: ReplaySubject<HsPanelItem>;
};

export interface HsQueryPopupServiceModel extends HsQueryPopupData {
  registerPopup(nativeElement: any);
  fillFeatures(features: Feature<Geometry>[]);
  showPopup(e: any): void;
  closePopup(): void;
  serializeFeatureAttributes(feature: Feature<Geometry>): any[];
}
