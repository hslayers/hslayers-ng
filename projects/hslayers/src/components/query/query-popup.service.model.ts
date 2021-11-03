import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import {Feature} from 'ol';
import {Geometry} from 'ol/geom';

export interface HsQueryPopupServiceModel {
  registerPopup(nativeElement: any);
  featuresUnderMouse: Feature<Geometry>[];
  featureLayersUnderMouse: VectorLayer<VectorSource<Geometry>>[];
  hoverPopup: any;

  fillFeatures(features: Feature<Geometry>[]);
  showPopup(e: any): void;
  closePopup(): void;
}
