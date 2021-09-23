import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';

import {HsAddDataService} from '../add-data.service';
import {HsAddDataVectorService} from './add-data-vector.service';
import {HsCommonEndpointsService} from '../../../common/endpoints/endpoints.service';
import {HsCommonLaymanService} from '../../../common/layman/layman.service';
import {HsHistoryListService} from '../../../common/history-list/history-list.service';
import {HsLanguageService} from '../../language/language.service';
import {HsLayerManagerService} from '../../layermanager/layermanager.service';
import {HsLayerUtilsService} from '../../utils/layer-utils.service';
import {HsLayoutService} from '../../layout/layout.service';
import {HsToastService} from '../../layout/toast/toast.service';
import {HsUploadedFiles} from '../../../common/upload/upload.component';
import {HsUtilsService} from '../../utils/utils.service';
import {Layer} from 'ol/layer';
import {Source} from 'ol/source';
import {accessRightsModel} from '../common/access-rights.model';
import {getHsLaymanSynchronizing} from '../../../common/layer-extensions';

@Component({
  selector: 'hs-add-data-url-vector',
  templateUrl: './add-data-vector.component.html',
})
export class HsAddDataVectorComponent implements OnInit {
  @Input() dataType: string;
  @ViewChild('vectorFileInput') vectorFileInput: ElementRef;

  srs = 'EPSG:4326';
  title = '';
  extract_styles = true;
  abstract: string;
  url: string;
  base64url: string;
  name = '';
  advancedPanelVisible = false;
  folder_name = '';
  features: any[] = [];
  featureCount = 0;
  type = '';
  errorOccurred = false;
  addUnder: Layer<Source> = null;
  showDetails = false;
  saveToLayman: boolean;
  isAuthorized = false;
  // Not possible to save KML to layman yet
  saveAvailable: boolean;
  access_rights: accessRightsModel = {
    'access_rights.write': 'private',
    'access_rights.read': 'EVERYONE',
  };
  uploadType = 'new';
  sourceLayer = null;
  vectorLayers;

  acceptedFormats: string;

  constructor(
    public hsAddDataVectorService: HsAddDataVectorService,
    public hsHistoryListService: HsHistoryListService,
    public hsLayoutService: HsLayoutService,
    public hsUtilsService: HsUtilsService,
    public hsAddDataService: HsAddDataService,
    public hsToastService: HsToastService,
    public hsLanguageService: HsLanguageService,
    public hsCommonEndpointsService: HsCommonEndpointsService,
    public hsCommonLaymanService: HsCommonLaymanService,
    public hsLayerManagerService: HsLayerManagerService,
    public hsLayerUtilsService: HsLayerUtilsService
  ) {
    const layman = this.hsCommonEndpointsService.endpoints.filter(
      (ep) => ep.type == 'layman'
    )[0];
    if (layman) {
      this.hsCommonLaymanService.authChange.subscribe((endpoint: any) => {
        this.isAuthorized =
          endpoint.user !== 'anonymous' && endpoint.user !== 'browser';
      });
      this.isAuthorized =
        layman.user !== 'anonymous' && layman.user !== 'browser';
    }
  }

  ngOnInit(): void {
    this.acceptedFormats =
      this.dataType == 'kml' ? '.kml, .gpx' : '.geojson, .json';
  }

  connect = async (): Promise<void> => {
    this.hsHistoryListService.addSourceHistory('vector', this.url);
    this.showDetails = true;
  };

  isKml(): boolean {
    if (this.type == 'kml' || this.url?.endsWith('kml')) {
      return true;
    } else {
      return false;
    }
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

  /**
   * Handler for adding non-wms service, file in template.
   */
  async add(): Promise<void> {
    this.uploadType == 'new'
      ? await this.addNewLayer()
      : await this.updateExistingLayer();

    this.hsLayoutService.setMainPanel('layermanager');
    this.setToDefault();
  }

  async updateExistingLayer(): Promise<void> {
    let features = this.features.length > 0 ? this.features : [];
    if (this.dataType != 'geojson') {
      const kml = await this.hsAddDataVectorService.convertUploadedData(
        this.vectorFileInput.nativeElement.files[0]
      );
      features = kml.features; //proper typing will get rid of this
    }
    this.hsLayerUtilsService.isLayerClustered(this.sourceLayer)
      ? this.sourceLayer.getSource().getSource().addFeatures(features)
      : this.sourceLayer.getSource().addFeatures(features);
  }

  async addNewLayer(): Promise<any> {
    const layer = await this.hsAddDataVectorService.addVectorLayer(
      this.features.length != 0 ? this.type : this.dataType,
      this.url || this.base64url,
      this.name,
      this.title,
      this.abstract,
      this.srs,
      {
        extractStyles: this.extract_styles,
        features: this.features,
        path: this.hsUtilsService.undefineEmptyString(this.folder_name),
        access_rights: this.access_rights,
        workspace: this.hsCommonEndpointsService.endpoints.filter(
          (ep) => ep.type == 'layman'
        )[0]?.user,
        queryCapabilities:
          this.dataType != 'kml' && !this.url?.endsWith('json'),
      },
      this.addUnder
    );
    this.hsAddDataVectorService.fitExtent(layer);

    if (this.saveToLayman) {
      this.awaitLayerSync(layer).then(() => {
        layer.getSource().dispatchEvent('addfeature');
      });
    }
    return layer;
  }

  async awaitLayerSync(layer): Promise<any> {
    while (getHsLaymanSynchronizing(layer)) {
      await new Promise((r) => setTimeout(r, 200));
    }
    return true;
  }

  handleFileUpload(evt: HsUploadedFiles): void {
    Array.from(evt.fileList).forEach(async (f) => {
      const uploadedData = await this.hsAddDataVectorService.readUploadedFile(
        f
      );
      if (uploadedData !== undefined) {
        uploadedData.url !== undefined
          ? (this.base64url = uploadedData.url)
          : ((this.url = ''), (this.base64url = ''));

        uploadedData.name !== undefined
          ? (this.name = uploadedData.name)
          : (this.name = '');

        uploadedData.title !== undefined
          ? (this.title = uploadedData.title)
          : (this.title = '');

        uploadedData.srs !== undefined
          ? (this.srs = uploadedData.srs.getCode())
          : (this.srs = 'EPSG:4326');

        uploadedData.abstract !== undefined
          ? (this.abstract = uploadedData.abstract)
          : (this.abstract = '');

        if (uploadedData.features !== undefined) {
          this.features = uploadedData.features;
          this.featureCount = uploadedData.features.length;
        } else {
          this.features = [];
          this.featureCount = 0;
        }
        if (uploadedData.type !== undefined) {
          this.type = uploadedData.type;
        } else {
          this.type = '';
        }
        if (this.isKml()) {
          this.saveToLayman = false;
          this.saveAvailable = false;
        } else {
          this.saveAvailable = true;
          this.saveToLayman = this.isAuthorized;
        }
        //add layman endpoint url as url to allow sync
        if (this.url == '' && this.saveToLayman) {
          this.url = this.hsCommonEndpointsService.endpoints.filter(
            (ep) => ep.type == 'layman'
          )[0].url;
        }
        this.showDetails = true;
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
  setToDefault(): void {
    this.srs = 'EPSG:4326';
    this.title = '';
    this.extract_styles = true;
    this.abstract = '';
    this.url = '';
    this.base64url = '';
    this.name = '';
    this.advancedPanelVisible = false;
    this.folder_name = '';
    this.features = [];
    this.featureCount = 0;
    this.type = '';
    this.showDetails = false;
    this.sourceLayer = null;
    this.vectorLayers = null;
    this.uploadType = 'new';
    if (this.vectorFileInput) {
      this.vectorFileInput.nativeElement.value = '';
    }
  }
}
