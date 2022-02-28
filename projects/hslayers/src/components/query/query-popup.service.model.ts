import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import {Feature} from 'ol';
import {Geometry} from 'ol/geom';
import {ReplaySubject} from 'rxjs';

import {HsPanelItem} from '../layout/panels/panel-item';
import {HsQueryPopupData} from './popup-data';

export type HsFeatureLayer = {
  title: string;
  feature: Feature<Geometry>[];
  layer: VectorLayer<VectorSource<Geometry>>;
  panelObserver: ReplaySubject<HsPanelItem>;
};

export interface HsQueryPopupServiceModel {
  registerPopup(nativeElement: any, app: string);
  apps: {
    [key: string]: HsQueryPopupData;
  };
  fillFeatures(features: Feature<Geometry>[], app: string);
  showPopup(e: any, app: string): void;
  closePopup(app: string): void;
  serializeFeatureAttributes(feature: Feature<Geometry>, app: string): any[];
}
