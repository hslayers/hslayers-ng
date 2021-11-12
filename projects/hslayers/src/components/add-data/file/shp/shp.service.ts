import {Injectable} from '@angular/core';

import {HsAddDataCommonFileService} from '../../common/common-file.service';
import {HsLanguageService} from '../../../language/language.service';
import {HsUploadedFiles} from '../../../../common/upload/upload.component';
import {fileDataObject} from '../types/file-data-object.type';

@Injectable({providedIn: 'root'})
export class HsFileShpService {
  fileUploadErrorHeader = 'ADDLAYERS.couldNotUploadSelectedFile';
  constructor(
    public hsLanguageService: HsLanguageService,
    public hsAddDataCommonFileService: HsAddDataCommonFileService
  ) {}

  async read(evt: HsUploadedFiles): Promise<void> {
    const filesRead = [];
    const files = Array.from(evt.fileList);
    const promises = [];
    const data: fileDataObject = {};
    try {
      for (const file of files) {
        const filePromise = new Promise((resolve) => {
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
        });
        promises.push(filePromise);
      }
      await Promise.all(promises);
      if (evt.uploader === 'shpdbfshx') {
        data.files = filesRead;
      }

      if (evt.uploader === 'sld') {
        data.sld = filesRead[0];
      } else {
        if (data.files.length == 3) {
          data.name = data.files[0].name.slice(0, -4);
          data.title = data.files[0].name.slice(0, -4);
          this.hsAddDataCommonFileService.dataObjectChanged.next(data);
        } else if (data.files.length > 3) {
          this.hsAddDataCommonFileService.catchError({
            message: this.hsLanguageService.getTranslationIgnoreNonExisting(
              'ADDLAYERS.SHP',
              'maximumNumberOf',
              {length: data.files.length}
            ),
            header: this.fileUploadErrorHeader,
          });
        } else {
          this.hsAddDataCommonFileService.catchError({
            message: 'ADDLAYERS.SHP.missingOneOrMore',
            header: this.fileUploadErrorHeader,
          });
        }
      }
    } catch (e) {
      this.hsAddDataCommonFileService.catchError({
        message: e.message,
        header: this.fileUploadErrorHeader,
      });
    }
  }
}
