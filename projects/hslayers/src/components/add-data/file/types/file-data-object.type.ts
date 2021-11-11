import {Layer} from 'ol/layer';
import {Source} from 'ol/source';

import {FileDescriptor} from './file-descriptor.type';
import {accessRightsModel} from '../../common/access-rights.model';

export type fileDataObject = {
  abstract?: string;
  access_rights?: accessRightsModel;
  addUnder?: Layer<Source>;
  extract_styles?: boolean;
  files?: FileDescriptor[];
  folder_name?: string;
  name?: string;
  saveAvailable?: boolean;
  saveToLayman?: boolean;
  sld?: FileDescriptor;
  srs?: string;
  title?: string;
  type?: string;
};
