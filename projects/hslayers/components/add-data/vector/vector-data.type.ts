import {Geometry} from 'ol/geom';
import {Layer} from 'ol/layer';
import {Source} from 'ol/source';
import {Vector as VectorLayer} from 'ol/layer';
import {Vector as VectorSource} from 'ol/source';

import {HsLayerDescriptor} from '../../layer-manager/layer-descriptor.interface';
import {accessRightsModel} from '../common/access-rights.model';

export type VectorDataObject = {
  abstract?: string;
  access_rights?: accessRightsModel;
  addUnder?: Layer<Source>;
  base64url?: string;
  extract_styles?: boolean;
  featureCount?: number;
  features?: Array<any>;
  geomProperty?: string;
  idProperty?: string;
  nativeFeatures?: Array<any>;
  folder_name?: string;
  name?: string;
  query?: string;
  // Not possible to save KML to layman yet
  saveAvailable?: boolean;
  saveToLayman?: boolean;
  showDetails?: boolean;
  sourceLayer?: VectorLayer<VectorSource>;
  srs?: string;
  nativeSRS?: string;
  serializedStyle?: string | {content: string};
  title?: string;
  type?: string;
  url?: string;
  vectorLayers?: HsLayerDescriptor[];
  allowedStyles?: 'qml' | 'sld' | 'sldqml';
};
