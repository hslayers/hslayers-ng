import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';

import {Cluster} from 'ol/source';

import {
  HsAddDataCommonFileService,
  HsAddDataCommonFileServiceParams,
} from '../../common/common-file.service';
import {HsAddDataVectorService} from '../vector.service';
import {HsCommonEndpointsService} from '../../../../common/endpoints/endpoints.service';
import {HsConfig, HsConfigObject} from '../../../../config.service';
import {HsLanguageService} from '../../../language/language.service';
import {HsLayerManagerService} from '../../../layermanager/layermanager.service';
import {HsLayerUtilsService} from '../../../utils/layer-utils.service';
import {HsLayoutService} from '../../../layout/layout.service';
import {HsToastService} from '../../../layout/toast/toast.service';
import {
  HsUploadComponent,
  HsUploadedFiles,
} from '../../../../common/upload/upload.component';
import {HsUtilsService} from '../../../utils/utils.service';
import {Subject, takeUntil} from 'rxjs';
import {VectorDataObject} from '../vector-data.type';
import {accessRightsModel} from '../../common/access-rights.model';

@Component({
  selector: 'hs-file-vector',
  templateUrl: 'vector-file.component.html',
})
export class HsAddDataVectorFileComponent
  implements OnInit, AfterViewInit, OnDestroy {
  @Input() fileType: 'geojson' | 'kml' | 'gpx';
  @Input() app = 'default';
  @ViewChild(HsUploadComponent) hsUploadComponent: HsUploadComponent;
  acceptedFormats: string;
  uploadType = 'new';
  data: VectorDataObject;
  fileInput: ElementRef;
  access_rights: accessRightsModel = {
    'access_rights.write': 'private',
    'access_rights.read': 'EVERYONE',
  };
  commonFileServiceRef: HsAddDataCommonFileServiceParams;
  configRef: HsConfigObject;
  private ngUnsubscribe = new Subject<void>();
  constructor(
    private hsAddDataVectorService: HsAddDataVectorService,
    private hsAddDataCommonFileService: HsAddDataCommonFileService,
    private hsToastService: HsToastService,
    public hsLanguageService: HsLanguageService,
    private hsCommonEndpointsService: HsCommonEndpointsService,
    private hsLayerManagerService: HsLayerManagerService,
    private hsLayerUtilsService: HsLayerUtilsService,
    private hsLayoutService: HsLayoutService,
    private hsUtilsService: HsUtilsService,
    private hsConfig: HsConfig
  ) {}
  ngAfterViewInit(): void {
    this.fileInput = this.hsUploadComponent.getFileInput();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  ngOnInit(): void {
    this.commonFileServiceRef = this.hsAddDataCommonFileService.get(this.app);
    this.configRef = this.hsConfig.get(this.app);
    this.commonFileServiceRef.dataObjectChanged
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((data) => {
        this.data.showDetails = true;
        Object.assign(this.data, data);
        // this.clearInput();
      });

    this.getAcceptedFormats();
    this.setToDefault();
  }

  getAcceptedFormats(): void {
    switch (this.fileType) {
      case 'kml':
        this.acceptedFormats = '.kml';
        break;
      case 'gpx':
        this.acceptedFormats = '.gpx';
        break;
      default:
        this.acceptedFormats = '.geojson, .json';
        break;
    }
  }

  /**
   * Handler for adding non-wms service, file in template.
   */
  async add(): Promise<void> {
    if (this.uploadType == 'new') {
      const response = await this.hsAddDataVectorService.addNewLayer(
        this.data,
        this.app
      );
      if (response.complete) {
        this.moveToLayerManager();
      }
    } else {
      await this.updateExistingLayer();
      this.moveToLayerManager();
    }
  }

  /**
   * After layer has successfully been added to the map, move to LM panel and clean up the code
   */
  moveToLayerManager(): void {
    this.hsLayoutService.setMainPanel('layermanager', this.app);
    this.hsAddDataVectorService.setPanelToCatalogue(this.app);
    this.setToDefault();
  }

  async updateExistingLayer(): Promise<void> {
    let features = this.data.features.length > 0 ? this.data.features : [];
    if (this.fileType != 'geojson') {
      const nonJson = await this.hsAddDataVectorService.convertUploadedData(
        this.fileInput.nativeElement.files[0],
        this.app
      );
      features = nonJson.features; //proper typing will get rid of this
    }
    this.hsLayerUtilsService.isLayerClustered(this.data.sourceLayer)
      ? (this.data.sourceLayer.getSource() as Cluster)
          .getSource()
          .addFeatures(features)
      : this.data.sourceLayer.getSource().addFeatures(features);
  }

  handleFileUpload(evt: HsUploadedFiles): void {
    Array.from(evt.fileList).forEach(async (f) => {
      const uploadedData = await this.hsAddDataVectorService.readUploadedFile(
        f,
        this.app
      );
      if (uploadedData !== undefined && !uploadedData.error) {
        uploadedData.url !== undefined
          ? (this.data.base64url = uploadedData.url)
          : ((this.data.url = undefined), (this.data.base64url = undefined));

        uploadedData.name !== undefined
          ? (this.data.name = uploadedData.name)
          : (this.data.name = '');

        uploadedData.title !== undefined
          ? (this.data.title = uploadedData.title)
          : (this.data.title = '');

        uploadedData.srs !== undefined
          ? (this.data.srs = uploadedData.srs.getCode())
          : (this.data.srs = 'EPSG:4326');

        uploadedData.abstract !== undefined
          ? (this.data.abstract = uploadedData.abstract)
          : (this.data.abstract = '');

        if (uploadedData.features !== undefined) {
          this.data.features = uploadedData.features;
          this.data.featureCount = uploadedData.features.length;
        } else {
          this.data.features = [];
          this.data.featureCount = 0;
        }
        if (uploadedData.nativeFeatures !== undefined) {
          this.data.nativeFeatures = uploadedData.nativeFeatures;
        }

        if (uploadedData.nativeSRS !== undefined) {
          this.data.nativeSRS = uploadedData.nativeSRS.getCode();
        }

        if (uploadedData.type !== undefined) {
          this.data.type = uploadedData.type;
        } else {
          this.data.type = this.fileType;
        }
        if (this.hsAddDataVectorService.isKml(this.data.type, this.data.url)) {
          this.data.saveToLayman = false;
          this.data.saveAvailable = false;
        } else {
          this.data.saveAvailable = true;
          this.data.saveToLayman =
            this.hsCommonEndpointsService.endpoints.filter(
              (ep) => ep.type == 'layman'
            )[0]?.authenticated;
        }
        //add layman endpoint url as url to allow sync
        if (
          this.hsUtilsService.undefineEmptyString(this.data.url) ===
            undefined &&
          this.data.saveToLayman
        ) {
          this.data.url = this.hsCommonEndpointsService.endpoints.filter(
            (ep) => ep.type == 'layman'
          )[0]?.url;
        }
        this.data.showDetails = true;
      } else {
        this.setToDefault();

        this.hsToastService.createToastPopupMessage(
          this.hsLanguageService.getTranslation(
            'ADDLAYERS.ERROR.someErrorHappened',
            undefined,
            this.app
          ),
          this.hsLanguageService.getTranslationIgnoreNonExisting(
            'ADDLAYERS',
            `${uploadedData?.error ?? 'someErrorHappened'}`,
            undefined,
            this.app
          ),
          {disableLocalization: true},
          this.app
        );
      }
    });
  }

  setUploadType(type: string): void {
    this.uploadType = type;
    if (type == 'existing') {
      this.data.vectorLayers = this.hsLayerManagerService.apps[
        this.app
      ].data.layers.filter((layer) => {
        return this.hsLayerUtilsService.isLayerVectorLayer(layer.layer);
      });
    }
  }

  setToDefault(): void {
    this.setDataToDefault();
    this.data.showDetails = false;
    this.uploadType = 'new';
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }
  /**
   * Reset data object to its default valuess
   */
  setDataToDefault(): void {
    this.data = {
      // Not possible to save KML to layman yet
      abstract: '',
      addUnder: null,
      base64url: '',
      extract_styles: false,
      featureCount: 0,
      features: [],
      nativeFeatures: [],
      folder_name: '',
      name: '',
      saveAvailable: false,
      saveToLayman: false,
      showDetails: false,
      srs: 'EPSG:4326',
      nativeSRS: undefined,
      title: '',
      type: this.fileType,
      url: undefined,
      serializedStyle: null,
      access_rights: {
        'access_rights.write': 'private',
        'access_rights.read': 'EVERYONE',
      },
      sourceLayer: null,
      vectorLayers: null,
    };
    this.hsAddDataCommonFileService.clearParams(this.app);
  }
}
