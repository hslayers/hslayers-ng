import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';

import {Cluster} from 'ol/source';

import {HsAddDataVectorService} from '../vector.service';
import {HsCommonEndpointsService} from '../../../../common/endpoints/endpoints.service';
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
import {accessRightsModel} from '../../common/access-rights.model';
import {vectorDataObject} from '../vector-data.type';

@Component({
  selector: 'hs-file-vector',
  templateUrl: 'vector-file.component.html',
})
export class HsAddDataVectorFileComponent implements OnInit, AfterViewInit {
  @Input() dataType: 'geojson' | 'kml' | 'gpx';
  @ViewChild(HsUploadComponent) hsUploadComponent: HsUploadComponent;
  acceptedFormats: string;
  uploadType = 'new';
  data: vectorDataObject;
  fileInput: ElementRef;
  access_rights: accessRightsModel = {
    'access_rights.write': 'private',
    'access_rights.read': 'EVERYONE',
  };
  constructor(
    public hsAddDataVectorService: HsAddDataVectorService,
    public hsToastService: HsToastService,
    public hsLanguageService: HsLanguageService,
    public hsCommonEndpointsService: HsCommonEndpointsService,
    public hsLayerManagerService: HsLayerManagerService,
    public hsLayerUtilsService: HsLayerUtilsService,
    public hsLayoutService: HsLayoutService,
    public hsUtilsService: HsUtilsService
  ) {}
  ngAfterViewInit(): void {
    this.fileInput = this.hsUploadComponent.getFileInput();
  }

  ngOnInit(): void {
    this.getAcceptedFormats();
    this.setToDefault();
  }

  getAcceptedFormats(): void {
    switch (this.dataType) {
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
    this.uploadType == 'new'
      ? await this.hsAddDataVectorService.addNewLayer(this.data)
      : await this.updateExistingLayer();
    this.hsLayoutService.setMainPanel('layermanager');
    this.hsAddDataVectorService.setPanelToCatalogue();
    this.setToDefault();
  }

  async updateExistingLayer(): Promise<void> {
    let features = this.data.features.length > 0 ? this.data.features : [];
    if (this.dataType != 'geojson') {
      const nonJson = await this.hsAddDataVectorService.convertUploadedData(
        this.fileInput.nativeElement.files[0]
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
        f
      );
      if (uploadedData !== undefined) {
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
        if (uploadedData.type !== undefined) {
          this.data.type = uploadedData.type;
        } else {
          this.data.type = '';
        }
        if (this.hsAddDataVectorService.isKml(this.data.type, this.data.url)) {
          this.data.saveToLayman = false;
          this.data.saveAvailable = false;
        } else {
          this.data.saveAvailable = true;
          this.data.saveToLayman =
            this.hsCommonEndpointsService.endpoints.filter(
              (ep) => ep.type == 'layman'
            )[0].authenticated;
        }
        //add layman endpoint url as url to allow sync
        if (
          this.hsUtilsService.undefineEmptyString(this.data.url) ===
            undefined &&
          this.data.saveToLayman
        ) {
          this.data.url = this.hsCommonEndpointsService.endpoints.filter(
            (ep) => ep.type == 'layman'
          )[0].url;
        }
        this.data.showDetails = true;
      } else {
        this.setToDefault();

        this.hsToastService.createToastPopupMessage(
          this.hsLanguageService.getTranslation(
            'ADDLAYERS.ERROR.someErrorHappened'
          ),
          this.hsLanguageService.getTranslationIgnoreNonExisting(
            'ADDLAYERS',
            'couldNotUploadSelectedFile'
          ),
          {disableLocalization: true}
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
        }
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

  setDataToDefault(): void {
    this.data = {
      // Not possible to save KML to layman yet
      abstract: '',
      addUnder: null,
      base64url: '',
      dataType: this.dataType,
      extract_styles: false,
      featureCount: 0,
      features: [],
      folder_name: '',
      name: '',
      saveAvailable: false,
      saveToLayman: false,
      showDetails: false,
      srs: 'EPSG:4326',
      title: '',
      type: '',
      url: undefined,
      access_rights: {
        'access_rights.write': 'private',
        'access_rights.read': 'EVERYONE',
      },
      sourceLayer: null,
      vectorLayers: null,
    };
  }
}
