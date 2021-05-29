import BaseLayer from 'ol/layer/Base';
import {Component, ElementRef, ViewChild} from '@angular/core';

import {HsAddDataService} from '../add-data.service';
import {HsAddDataVectorService} from './add-data-vector.service';
import {HsCommonEndpointsService} from '../../../common/endpoints/endpoints.service';
import {HsCommonLaymanService} from '../../../common/layman/layman.service';
import {HsHistoryListService} from '../../../common/history-list/history-list.service';
import {HsLanguageService} from '../../language/language.service';
import {HsLayoutService} from '../../layout/layout.service';
import {HsToastService} from '../../layout/toast/toast.service';
import {HsUtilsService} from '../../utils/utils.service';

import {accessRightsInterface} from '../common/access-rights.interface';
import {getHsLaymanSynchronizing} from '../../../common/layer-extensions';

@Component({
  selector: 'hs-add-data-url-vector',
  templateUrl: './add-data-vector.directive.html',
})
export class HsAddDataVectorComponent {
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
  dropzoneActive = false;
  features: any[] = [];
  featureCount = 0;
  type = '';
  errorOccured = false;
  addUnder: BaseLayer = null;
  showDetails = false;
  saveToLayman: boolean;
  isAuthorized = false;
  // Not possible to save KML to layman yet
  saveAvailable: boolean;
  access_rights: accessRightsInterface = {
    'access_rights.write': 'EVERYONE',
    'access_rights.read': 'EVERYONE',
  };
  constructor(
    public hsAddDataVectorService: HsAddDataVectorService,
    public hsHistoryListService: HsHistoryListService,
    public hsLayoutService: HsLayoutService,
    public hsUtilsService: HsUtilsService,
    public hsAddDataService: HsAddDataService,
    public hsToastService: HsToastService,
    public hsLanguageService: HsLanguageService,
    public hsCommonEndpointsService: HsCommonEndpointsService,
    public hsCommonLaymanService: HsCommonLaymanService
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

  /**
   * Handler for adding nonwms service, file in template.
   *
   * @function add
   */
  async add() {
    const layer = await this.hsAddDataVectorService.addVectorLayer(
      this.type,
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
      },
      this.addUnder
    );
    this.hsAddDataVectorService.fitExtent(layer);

    if (this.saveToLayman) {
      this.awaitLayerSync(layer).then(() => {
        layer.getSource().dispatchEvent('addfeature');
      });
    }

    this.hsLayoutService.setMainPanel('layermanager');
    this.setToDefault();
    this.showDetails = false;
    return layer;
  }

  async awaitLayerSync(layer): Promise<any> {
    while (getHsLaymanSynchronizing(layer)) {
      await new Promise((r) => setTimeout(r, 200));
    }
    return true;
  }

  dropZoneState($event: boolean): void {
    this.dropzoneActive = $event;
  }
  handleFileUpload(fileList: FileList): any {
    Array.from(fileList).forEach(async (f) => {
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
          this.hsLanguageService.getTranslation('ADDLAYERS.someErrorHappened'),
          this.hsLanguageService.getTranslationIgnoreNonExisting(
            'ADDLAYERS',
            'couldNotUploadSelectedFile'
          ),
          true
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
    this.dropzoneActive = false;
    this.features = [];
    this.featureCount = 0;
    this.type = '';
    this.showDetails = false;
    this.vectorFileInput.nativeElement.value = '';
  }
}
