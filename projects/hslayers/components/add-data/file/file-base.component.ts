import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

import {Layer} from 'ol/layer';
import {Source} from 'ol/source';

import {
  AddDataFileType,
  FileDataObject,
  FileDescriptor,
} from 'hslayers-ng/types';
import {
  HsAddDataCommonFileService,
  HsAddDataCommonService,
} from 'hslayers-ng/services/add-data';
import {HsConfig} from 'hslayers-ng/config';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {HsUploadComponent} from 'hslayers-ng/common/upload';

@Component({
  template: '<div></div>',
  standalone: false,
})
export class HsAddDataFileBaseComponent implements OnInit, AfterViewInit {
  hsAddDataCommonService = inject(HsAddDataCommonService);
  hsAddDataCommonFileService = inject(HsAddDataCommonFileService);
  hsLayoutService = inject(HsLayoutService);
  hsConfig = inject(HsConfig);

  app: string;
  data: FileDataObject;
  fileInput: ElementRef;
  acceptedFormats: string;
  baseFileType: AddDataFileType;
  private destroyRef = inject(DestroyRef);

  @ViewChild(HsUploadComponent) hsUploadComponent: HsUploadComponent;

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
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        this.hsAddDataCommonService.showDetails = true;
        Object.assign(this.data, data);
        this.clearInput();
      });

    this.hsAddDataCommonFileService.layerAddedAsService
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((success) => {
        if (success) {
          this.hsLayoutService.setMainPanel('layerManager');
          this.hsAddDataCommonService.setPanelToCatalogue();
        }
        this.setDataToDefault();
        this.clearInput();
      });

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
      serializedStyle: null,
      srs: undefined,
      title: '',
      type: this.baseFileType,
      allowedStyles: 'sldqml',
    };
    this.hsAddDataCommonFileService.clearParams();
    this.hsAddDataCommonService.clearParams();
  }
}
