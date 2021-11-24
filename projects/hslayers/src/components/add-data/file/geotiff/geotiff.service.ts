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
      if (!this.hsAddDataCommonFileService.filesValid(files)) {
        return;
      }
      for (const file of files) {
        const filePromise = new Promise(async (resolve) => {
          if (this.hsAddDataCommonFileService.isZip(file.type)) {
            const reader = new FileReader();
            reader.onload = (loadEvent) => {
              filesRead.push({
                name: file.name,
                type: file.type,
                content: loadEvent.target.result,
              });
              resolve(reader.result);
            };
            reader.readAsArrayBuffer(file);
          } else {
            const tiff = await fromBlob(file);
            filesRead.push({
              name: tiff.source.file.name,
              type: tiff.source.file.type,
              content: await tiff.source.file,
            });
            resolve(tiff);
          }
        });
        promises.push(filePromise);
      }
      await Promise.all(promises);

      data.files = filesRead;
      this.hsAddDataCommonFileService.setDataName(data);
    } catch (error) {
      this.hsAddDataCommonFileService.catchError({message: error.message});
    }
  }
}
