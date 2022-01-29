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
      switch (evt.uploader) {
        case 'shpdbfshx':
          data.files = filesRead;
          this.checkShpFiles(data);
          break;
        case 'sld':
          data.sld = filesRead[0];
          this.hsAddDataCommonFileService.dataObjectChanged.next(data);
          break;
        case 'hs-file-raster':
          data.files = filesRead;
          this.checkRasterFiles(data);
          break;
        default:
          return;
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
      this.tooManyFiles(3, data.files.length);
    } else {
      this.hsAddDataCommonFileService.catchError({
        message: 'ADDLAYERS.SHP.missingOneOrMore',
        header: this.fileUploadErrorHeader,
      });
    }
  }

  checkRasterFiles(data: fileDataObject): void {
    if (
      data.files.length == 2 ||
      this.hsAddDataCommonFileService.isZip(data.files[0].type) ||
      this.hsAddDataCommonFileService.isGeotiff(data.files[0].type) ||
      this.hsAddDataCommonFileService.isJp2(data.files[0].type)
    ) {
      this.hsAddDataCommonFileService.setDataName(data);
    } else if (data.files.length > 2) {
      this.tooManyFiles(2, data.files.length);
    } else {
      this.hsAddDataCommonFileService.catchError({
        message: 'ADDLAYERS.missingImageorWorldFile',
        header: this.fileUploadErrorHeader,
      });
    }
  }

  tooManyFiles(allowed: number, length: number): void {
    this.hsAddDataCommonFileService.catchError({
      message: this.hsLanguageService.getTranslationIgnoreNonExisting(
        'ADDLAYERS.SHP',
        'maximumNumberOf',
        {allowed, length}
      ),
      header: this.fileUploadErrorHeader,
    });
  }
}
