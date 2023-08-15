import {Layer} from 'ol/layer';
import {Source} from 'ol/source';

import {FileFormDataObject} from './file-form-data.type';
import {IntersectWithTooltip} from '../../../../common/type-intersection.type';

type FileDataExtenstion = {
  addUnder?: Layer<Source>;
  extract_styles?: boolean;
  folder_name?: string;
  loadAsType?: 'wms' | 'wfs';
  saveAvailable?: boolean;
  saveToLayman?: boolean;
  type?: string;
};

export type FileDataObject = IntersectWithTooltip<
  Partial<FileFormDataObject> & FileDataExtenstion
>;
