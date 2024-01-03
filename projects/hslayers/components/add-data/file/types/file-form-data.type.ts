import {FileDescriptor} from './file-descriptor.type';
import {accessRightsModel} from 'hslayers-ng/common/types';

/**
 * @param allowedStyles - Allowed file formats (SLD, QML or both)
 */
export type FileFormData = {
  abstract: string;
  access_rights: accessRightsModel;
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
