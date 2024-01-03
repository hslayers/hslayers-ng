import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';

import {Layer} from 'ol/layer';
import {Source} from 'ol/source';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {AddDataFileType} from './types/file.type';
import {FileDataObject} from './types/file-data-object.type';
import {FileDescriptor} from './types/file-descriptor.type';
import {HsAddDataCommonFileService} from '../common/common-file.service';
import {HsAddDataCommonService} from '../common/common.service';
import {HsConfig} from 'hslayers-ng/config';
import {HsLayoutService} from 'hslayers-ng/components/layout';
import {HsUploadComponent} from 'hslayers-ng/common/upload';

@Component({
  template: '<div></div>',
})
export class HsAddDataFileBaseComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  app: string;
  data: FileDataObject;
  fileInput: ElementRef;
  acceptedFormats: string;
  baseFileType: AddDataFileType;
  private end = new Subject<void>();
  @ViewChild(HsUploadComponent) hsUploadComponent: HsUploadComponent;
  constructor(
    public hsAddDataCommonService: HsAddDataCommonService,
    public hsAddDataCommonFileService: HsAddDataCommonFileService,
    public hsLayoutService: HsLayoutService,
    public hsConfig: HsConfig,
  ) {}

  clearInput(): void {
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  ngAfterViewInit(): void {
    if (this.hsUploadComponent) {
      this.fileInput = this.hsUploadComponent.getFileInput();
    }
  }

  ngOnInit(): void {
    this.app = this.hsConfig.id;
    this.hsAddDataCommonFileService.dataObjectChanged
      .pipe(takeUntil(this.end))
      .subscribe((data) => {
        this.hsAddDataCommonService.showDetails = true;
        Object.assign(this.data, data);
        this.clearInput();
      });

    this.hsAddDataCommonFileService.layerAddedAsService
      .pipe(takeUntil(this.end))
      .subscribe((success) => {
        if (success) {
          this.hsLayoutService.setMainPanel('layerManager');
          this.hsAddDataCommonService.setPanelToCatalogue();
        }
        this.setDataToDefault();
        this.clearInput();
      });

    this.setDataToDefault();
    this.hsAddDataCommonFileService.pickEndpoint();
  }

  /**
   * Reset data object to its default values
   */
  setDataToDefault(): void {
    this.data = {
      abstract: '',
      access_rights: {
        'access_rights.write': 'private',
        'access_rights.read': 'EVERYONE',
      },
      addUnder: null as Layer<Source>,
      extract_styles: false,
      files: [] as FileDescriptor[],
      folder_name: '',
      name: '',
      saveAvailable: true,
      saveToLayman: true,
      serializedStyle: null,
      srs: undefined,
      title: '',
      type: this.baseFileType,
      allowedStyles: 'sldqml',
    };
    this.hsAddDataCommonFileService.clearParams();
    this.hsAddDataCommonService.clearParams();
  }

  ngOnDestroy(): void {
    this.end.next();
    this.end.complete();
  }
}
