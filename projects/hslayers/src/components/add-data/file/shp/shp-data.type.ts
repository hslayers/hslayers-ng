import {Layer} from 'ol/layer';
import {Source} from 'ol/source';

import {FileDescriptor} from './file-descriptor.type';

export type fileShpDataObject = {
  abstract?: string;
  addUnder?: Layer<Source>;
  errorDetails?: [];
  errorMessage?: string;
  errorOccurred?: boolean;
  extract_styles?: boolean;
  files?: FileDescriptor[];
  folder_name?: string;
  name?: string;
  resultCode?: string;
  showDetails?: boolean;
  sld: FileDescriptor;
  srs?: string;
  title?: string;
  type?: string;
};
