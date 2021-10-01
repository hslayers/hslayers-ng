import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';

import {Layer} from 'ol/layer';
import {Source} from 'ol/source';

import {HsAddDataService} from '../../add-data.service';
import {HsAddDataVectorService} from '../add-data-vector.service';
import {HsCommonEndpointsService} from '../../../../common/endpoints/endpoints.service';
import {HsLanguageService} from '../../../../components/language/language.service';
import {HsLayerDescriptor} from '../../../../components/layermanager/layer-descriptor.interface';
import {HsLayerManagerService} from '../../../../components/layermanager/layermanager.service';
import {HsLayerUtilsService} from '../../../../components/utils/layer-utils.service';
import {HsLayoutService} from '../../../../components/layout/layout.service';
import {HsToastService} from '../../../../components/layout/toast/toast.service';
import {
  HsUploadComponent,
  HsUploadedFiles,
} from '../../../../common/upload/upload.component';
import {HsUtilsService} from '../../../../components/utils/utils.service';
import {accessRightsModel} from '../../common/access-rights.model';
import {addDataVectorDataObject} from '../add-data-vector-data.type';

@Component({
  selector: 'hs-add-data-vector-file',
  templateUrl: 'add-data-vector-file.component.html',
})
export class HsAddDataVectorFileComponent implements OnInit, AfterViewInit {
  @Input() dataType: 'geojson' | 'kml' | 'gpx';
  @ViewChild(HsUploadComponent) hsUploadComponent: HsUploadComponent;
  acceptedFormats: string;
  uploadType = 'new';
  sourceLayer = null;
  vectorLayers: HsLayerDescriptor[];
  data: addDataVectorDataObject;
  vectorFileInput: ElementRef;
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
    public hsUtilsService: HsUtilsService,
    public hsAddDataService: HsAddDataService
  ) {}
  ngAfterViewInit(): void {
    this.vectorFileInput = this.hsUploadComponent.getVectorFileInput();
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
    this.setToDefault();
  }

  async updateExistingLayer(): Promise<void> {
    let features = this.data.features.length > 0 ? this.data.features : [];
    if (this.dataType != 'geojson') {
      const nonJson = await this.hsAddDataVectorService.convertUploadedData(
        this.vectorFileInput.nativeElement.files[0]
      );
      features = nonJson.features; //proper typing will get rid of this
    }
    this.hsLayerUtilsService.isLayerClustered(this.sourceLayer)
      ? this.sourceLayer.getSource().getSource().addFeatures(features)
      : this.sourceLayer.getSource().addFeatures(features);
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
          this.data.saveToLayman = this.hsAddDataService.isAuthorized;
        }
        //add layman endpoint url as url to allow sync
        if (this.data.url == '' && this.data.saveToLayman) {
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
      this.vectorLayers = this.hsLayerManagerService.data.layers.filter(
        (layer) => {
          return this.hsLayerUtilsService.isLayerVectorLayer(layer.layer);
        }
      );
    }
  }

  setToDefault(): void {
    this.setToDefaultData();
    this.data.showDetails = false;
    this.sourceLayer = null;
    this.vectorLayers = null;
    this.uploadType = 'new';
    if (this.vectorFileInput) {
      this.vectorFileInput.nativeElement.value = '';
    }
  }

  setToDefaultData(): void {
    this.data = {
      // Not possible to save KML to layman yet
      abstract: '',
      addUnder: null as Layer<Source>,
      base64url: '',
      dataType: this.dataType,
      errorOccurred: false,
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
    };
  }
}
