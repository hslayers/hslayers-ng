import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';

import {Layer} from 'ol/layer';
import {Source} from 'ol/source';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {AddDataFileType} from './types/file.type';
import {FileDescriptor} from './types/file-descriptor.type';
import {HsAddDataCommonFileService} from '../common/common-file.service';
import {HsAddDataCommonService} from '../common/common.service';
import {HsLayoutService} from '../../layout/layout.service';
import {HsUploadComponent} from '../../../common/upload/upload.component';
import {fileDataObject} from './types/file-data-object.type';

@Component({
  template: '<div></div>',
})
export class HsAddDataFileBaseComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  @Input() app = 'default';
  data: fileDataObject;
  fileInput: ElementRef;
  acceptedFormats: string;
  baseDataType: AddDataFileType;
  private ngUnsubscribe = new Subject<void>();
  @ViewChild(HsUploadComponent) hsUploadComponent: HsUploadComponent;
  constructor(
    public hsAddDataCommonService: HsAddDataCommonService,
    public hsAddDataCommonFileService: HsAddDataCommonFileService,
    public hsLayoutService: HsLayoutService
  ) {
    this.hsAddDataCommonFileService.dataObjectChanged
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((data) => {
        this.hsAddDataCommonService.showDetails = true;
        Object.assign(this.data, data);
        this.clearInput();
      });

    this.hsAddDataCommonFileService.layerAddedAsWms
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((success) => {
        if (success) {
          this.hsLayoutService.setMainPanel('layermanager', this.app);
          this.hsAddDataCommonService.setPanelToCatalogue();
        }
        this.setDataToDefault();
        this.clearInput();
      });
  }

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
    this.hsAddDataCommonFileService.pickEndpoint();
    this.setDataToDefault();
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
      sld: null,
      srs: null,
      title: '',
      type: this.baseDataType,
    };
    this.hsAddDataCommonFileService.clearParams();
    this.hsAddDataCommonService.clearParams();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
