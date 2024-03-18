import {AccessRightsModel} from '../../access-rights.model';
import {FileDescriptor} from './file-descriptor.type';

/**
 * @param allowedStyles - Allowed file formats (SLD, QML or both)
 */
export type FileFormData = {
  abstract: string;
  access_rights: AccessRightsModel;
  files: FileDescriptor[];
  name: string;
  serializedStyle: FileDescriptor;
  allowedStyles?: 'qml' | 'sld' | 'sldqml';
  srs: string;
  title: string;
  timeRegex?: string;
};

type Optional<T> = {[P in keyof T]?: T[P]};

export type FileFormDataObject = Optional<FileFormData>;
