import {FileDescriptor} from './file-descriptor.type';
import {accessRightsModel} from '../../common/access-rights.model';

export type FileFormData = {
  abstract: string;
  access_rights: accessRightsModel;
  files: FileDescriptor[];
  name: string;
  serializedStyle: FileDescriptor;
  srs: string;
  title: string;
  timeRegex?: string;
};

type Optional<T> = {[P in keyof T]?: T[P]};

export type FileFormDataObject = Optional<FileFormData>;
