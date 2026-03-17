import Feature from 'ol/Feature';
import Geometry from 'ol/geom/Geometry';
import Layer from 'ol/layer/Layer';
import Source from 'ol/source/Source';

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
