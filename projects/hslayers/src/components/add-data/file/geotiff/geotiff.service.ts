import {Injectable} from '@angular/core';

import {fromBlob} from 'geotiff';

import {HsAddDataCommonFileService} from '../../common/common-file.service';

import {HsUploadedFiles} from '../../../../common/upload/upload.component';
import {fileDataObject} from '../types/file-data-object.type';

@Injectable({
  providedIn: 'root',
})
export class HsFileGeotiffService {
  constructor(public hsAddDataCommonFileService: HsAddDataCommonFileService) {}

  async read(datasource: HsUploadedFiles): Promise<void> {
    const filesRead = [];
    const promises = [];
    const data: fileDataObject = {};
    const files = Array.from(datasource.fileList);
    try {
      for (const file of files) {
        const filePromise = new Promise(async (resolve) => {
          const tiff = await fromBlob(file);
          filesRead.push({
            name: tiff.source.file.name,
            type: tiff.source.file.type,
            content: await tiff.source.file,
          });
          resolve(tiff);
        });
        promises.push(filePromise);
      }
      if (datasource.uploader === 'hs-geotiff-file') {
        data.files = filesRead;
      }
      await Promise.all(promises);
      data.name = data.files[0].name.slice(0, -4);
      data.title = data.files[0].name.slice(0, -4);
      this.hsAddDataCommonFileService.dataObjectChanged.next(data);
    } catch (error) {
      this.hsAddDataCommonFileService.catchError({message: error.message});
    }
  }
}
