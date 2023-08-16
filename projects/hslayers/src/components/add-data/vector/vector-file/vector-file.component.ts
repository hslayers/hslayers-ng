import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {Subject, takeUntil} from 'rxjs';

import {Cluster} from 'ol/source';
import {GeoJSON} from 'ol/format';

import {DEFAULT_VECTOR_LOAD_TYPE} from '../../enums/load-types.const';
import {HsAddDataCommonFileService} from '../../common/common-file.service';
import {HsAddDataVectorService} from '../vector.service';
import {HsCommonLaymanService} from '../../../../common/layman/layman.service';
import {HsConfig} from '../../../../config.service';
import {HsLanguageService} from '../../../language/language.service';
import {HsLayerManagerService} from '../../../layermanager/layermanager.service';
import {HsLayerUtilsService} from '../../../utils/layer-utils.service';
import {HsLayoutService} from '../../../layout/layout.service';
import {HsMapService} from '../../../map/map.service';
import {HsToastService} from '../../../layout/toast/toast.service';
import {
  HsUploadComponent,
  HsUploadedFiles,
} from '../../../../common/upload/upload.component';
import {HsUtilsService} from '../../../utils/utils.service';
import {VectorFileDataType} from '../../common/advanced-options/advanced-options.component';
import {accessRightsModel} from '../../common/access-rights.model';

@Component({
  selector: 'hs-file-vector',
  templateUrl: 'vector-file.component.html',
})
export class HsAddDataVectorFileComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  @Input() fileType: 'geojson' | 'kml' | 'gpx';

  @ViewChild(HsUploadComponent) hsUploadComponent: HsUploadComponent;
  app: string;
  acceptedFormats: string;
  uploadType = 'new';
  data: VectorFileDataType;
  fileInput: ElementRef;
  access_rights: accessRightsModel = {
    'access_rights.write': 'private',
    'access_rights.read': 'EVERYONE',
  };
  private end = new Subject<void>();

  constructor(
    private hsAddDataVectorService: HsAddDataVectorService,
    public hsAddDataCommonFileService: HsAddDataCommonFileService,
    private hsCommonLaymanService: HsCommonLaymanService,
    private hsConfig: HsConfig,
    public hsLanguageService: HsLanguageService,
    private hsLayerManagerService: HsLayerManagerService,
    private hsLayerUtilsService: HsLayerUtilsService,
    private hsLayoutService: HsLayoutService,
    private hsMapService: HsMapService,
    private hsToastService: HsToastService,
    private hsUtilsService: HsUtilsService,
  ) {}

  ngAfterViewInit(): void {
    this.fileInput = this.hsUploadComponent.getFileInput();
  }

  ngOnDestroy(): void {
    this.end.next();
    this.end.complete();
  }

  ngOnInit(): void {
    this.app = this.hsConfig.id;
    this.hsAddDataCommonFileService.dataObjectChanged
      .pipe(takeUntil(this.end))
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
   * Handler for adding vector file, file in template.
   */
  async add(): Promise<void> {
    if (this.uploadType == 'new') {
      if (this.data.loadAsType === 'wms') {
        await this.addAsWms();
      } else {
        const response = await this.hsAddDataVectorService.addNewLayer(
          this.data,
        );
        if (!response.complete) {
          return;
        }
      }
    } else {
      await this.updateExistingLayer();
    }
    this.moveToLayerManager();
  }

  /**
   * Upload vector file to Layman then load it as WMS
   * Converts already parsed features into GeoJSON.
   * We intentionally ignore if the file was originally KML or GPX as only GeoJSON is supported natively by Layman.
   */
  async addAsWms(): Promise<void> {
    this.data.files = [
      {
        name: this.data.name + '.geojson',
        type: '',
        // It is kinda silly to first parse and then serialise the features again, but the current UI/IX design prevents doing it differently
        content: new GeoJSON().writeFeatures(this.data.features),
      },
    ];
    this.data.srs = this.hsMapService.getCurrentProj().getCode();
    return await this.hsAddDataCommonFileService.addAsService(this.data);
  }

  /**
   * After layer has successfully been added to the map, move to LM panel and clean up the code
   */
  moveToLayerManager(): void {
    this.hsLayoutService.setMainPanel('layermanager');
    this.hsAddDataVectorService.setPanelToCatalogue();
    this.setToDefault();
  }

  async updateExistingLayer(): Promise<void> {
    let features = this.data.features.length > 0 ? this.data.features : [];
    if (this.fileType != 'geojson') {
      const nonJson = await this.hsAddDataVectorService.convertUploadedData(
        this.fileInput.nativeElement.files[0],
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
            this.hsCommonLaymanService.layman?.authenticated;
          if (this.data.saveToLayman) {
            this.data.loadAsType = DEFAULT_VECTOR_LOAD_TYPE;
          }
        }
        //add layman endpoint url as url to allow sync
        if (
          this.hsUtilsService.undefineEmptyString(this.data.url) ===
            undefined &&
          this.data.saveToLayman
        ) {
          this.data.url = this.hsCommonLaymanService.layman?.url;
        }
        this.data.showDetails = true;
      } else {
        this.setToDefault();

        this.hsToastService.createToastPopupMessage(
          this.hsLanguageService.getTranslation(
            'ADDLAYERS.ERROR.someErrorHappened',
            undefined,
          ),
          this.hsLanguageService.getTranslationIgnoreNonExisting(
            'ADDLAYERS',
            `${uploadedData?.error ?? 'someErrorHappened'}`,
            undefined,
          ),
          {disableLocalization: true},
        );
      }
    });
  }

  setUploadType(type: string): void {
    this.uploadType = type;
    if (type == 'existing') {
      this.data.vectorLayers = this.hsLayerManagerService.data.layers.filter(
        (layer) => {
          return this.hsLayerUtilsService.isLayerVectorLayer(layer.layer);
        },
      );
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
   * Reset data object to its default values
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
      allowedStyles: 'sldqml',
    };
    this.hsAddDataCommonFileService.clearParams();
  }
}
