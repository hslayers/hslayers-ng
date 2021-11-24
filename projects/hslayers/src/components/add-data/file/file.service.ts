import {Injectable} from '@angular/core';

import {HsAddDataCommonFileService} from './../common/common-file.service';
import {HsLanguageService} from './../../language/language.service';
import {HsUploadedFiles} from './../../../common/upload/upload.component';
import {fileDataObject} from './types/file-data-object.type';

@Injectable({providedIn: 'root'})
export class HsFileService {
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
      if (!this.hsAddDataCommonFileService.filesValid(files)) {
        return;
      }
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
        this.checkShpFiles(data);
      }
      if (evt.uploader === 'sld') {
        data.sld = filesRead[0];
        this.hsAddDataCommonFileService.dataObjectChanged.next(data);
      }
      if (evt.uploader === 'hs-geotiff-file') {
        data.files = filesRead;
        this.hsAddDataCommonFileService.setDataName(data);
      }
    } catch (e) {
      this.hsAddDataCommonFileService.catchError({
        message: e.message,
        header: this.fileUploadErrorHeader,
      });
    }
  }
  checkShpFiles(data: fileDataObject): void {
    if (
      data.files.length == 3 ||
      this.hsAddDataCommonFileService.isZip(data.files[0].type)
    ) {
      this.hsAddDataCommonFileService.setDataName(data);
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
}
