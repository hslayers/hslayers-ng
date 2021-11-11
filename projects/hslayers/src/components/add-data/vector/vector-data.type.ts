import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import {Geometry} from 'ol/geom';
import {Layer} from 'ol/layer';
import {Source} from 'ol/source';

import {HsLayerDescriptor} from '../../layermanager/layer-descriptor.interface';
import {accessRightsModel} from '../common/access-rights.model';

export type vectorDataObject = {
  abstract?: string;
  access_rights?: accessRightsModel;
  addUnder?: Layer<Source>;
  base64url?: string;
  dataType?: string;
  extract_styles?: boolean;
  featureCount?: number;
  features?: Array<any>;
  folder_name?: string;
  name?: string;
  // Not possible to save KML to layman yet
  saveAvailable?: boolean;
  saveToLayman?: boolean;
  showDetails?: boolean;
  sourceLayer?: VectorLayer<VectorSource<Geometry>>;
  srs?: string;
  title?: string;
  type?: string;
  url?: string;
  vectorLayers?: HsLayerDescriptor[];
};
