import {Injectable} from '@angular/core';

import {FileDataObject} from './types/file-data-object.type';
import {HsAddDataCommonFileService} from './../common/common-file.service';
import {HsLanguageService} from './../../language/language.service';
import {HsUploadedFiles} from './../../../common/upload/upload.component';

@Injectable({providedIn: 'root'})
export class HsFileService {
  fileUploadErrorHeader = 'ADDLAYERS.couldNotUploadSelectedFile';
  constructor(
    public hsLanguageService: HsLanguageService,
    public hsAddDataCommonFileService: HsAddDataCommonFileService,
  ) {}

  async read(evt: HsUploadedFiles, readAsText: boolean = false): Promise<void> {
    const filesRead = [];
    const files = Array.from(evt.fileList);
    const promises = [];
    const data: FileDataObject = {};
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
          const readerMethod = readAsText ? 'readAsText' : 'readAsArrayBuffer';
          reader[readerMethod](file);
        });
        promises.push(filePromise);
      }
      await Promise.all(promises);
      if (evt.uploader.includes('shpdbfshx')) {
        data.files = filesRead;
        this.checkShpFiles(data);
      } else if (evt.uploader.includes('style')) {
        data.serializedStyle = filesRead[0];
        this.hsAddDataCommonFileService.dataObjectChanged.next(data);
      } else if (evt.uploader.includes('hs-file-raster')) {
        data.files = filesRead;
        this.checkRasterFiles(data);
      }
    } catch (e) {
      this.hsAddDataCommonFileService.displayErrorMessage({
        message: e.message,
        header: this.fileUploadErrorHeader,
      });
    }
  }
  checkShpFiles(data: FileDataObject): void {
    if (
      data.files.length == 3 ||
      this.hsAddDataCommonFileService.isZip(data.files[0].type)
    ) {
      this.hsAddDataCommonFileService.setDataName(data);
    } else if (data.files.length > 3) {
      this.tooManyFiles(3, data.files.length);
    } else {
      this.hsAddDataCommonFileService.displayErrorMessage({
        message: 'ADDLAYERS.SHP.missingOneOrMore',
        header: this.fileUploadErrorHeader,
      });
    }
  }

  checkRasterFiles(data: FileDataObject): void {
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
      this.hsAddDataCommonFileService.displayErrorMessage({
        message: 'ADDLAYERS.missingImageorWorldFile',
        header: this.fileUploadErrorHeader,
      });
    }
  }

  tooManyFiles(allowed: number, length: number): void {
    this.hsAddDataCommonFileService.displayErrorMessage({
      message: this.hsLanguageService.getTranslationIgnoreNonExisting(
        'ADDLAYERS.SHP',
        'maximumNumberOf',
        {allowed, length},
      ),
      header: this.fileUploadErrorHeader,
    });
  }
}
