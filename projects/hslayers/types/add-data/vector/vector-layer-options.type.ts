import {Feature} from 'ol';
import {Geometry} from 'ol/geom';
import {Style} from 'ol/style';
import {StyleFunction} from 'ol/style/Style';

import {AccessRightsModel} from '../../access-rights.model';

export type HsVectorLayerOptions = {
  opacity?: number;
  visible?: boolean;
  path?: string;
  fromComposition?: boolean;
  geomAttribute?: string;
  idAttribute?: string;
  style?: string | Style | Array<Style> | StyleFunction;
  endpointUrl?: string;
  extractStyles?: boolean;
  features?: Feature<Geometry>[];
  workspace?: string;
  access_rights?: AccessRightsModel;
  query?: string;
  queryCapabilities?: boolean;
  sld?: string;
  qml?: string;
  saveToLayman?: boolean;
};
