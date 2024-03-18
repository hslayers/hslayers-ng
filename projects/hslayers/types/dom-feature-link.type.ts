import {Feature} from 'ol';
import {Geometry} from 'ol/geom';
import {Layer} from 'ol/layer';
import {Source} from 'ol/source';

export type DOMFeatureLink = {
  domSelector: string;
  feature:
    | string
    | Feature<Geometry>
    | ((layer: Layer<Source>, domElement: Element) => any);
  event: string;
  actions: [
    'zoomToExtent' | 'panToCenter' | 'showPopup',
    (
      | 'hidePopup'
      | ((feature: Feature<Geometry>, domElement: Element, event: any) => any)
    ),
  ];
};
