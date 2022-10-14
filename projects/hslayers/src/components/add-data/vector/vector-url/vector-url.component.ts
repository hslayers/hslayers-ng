import {Component, Input, OnDestroy, OnInit} from '@angular/core';

import {Layer} from 'ol/layer';
import {Source} from 'ol/source';
import {Subject, takeUntil} from 'rxjs';

import {HsAddDataCommonFileService} from '../../common/common-file.service';
import {HsAddDataVectorService} from '../vector.service';
import {HsHistoryListService} from '../../../../common/history-list/history-list.service';
import {HsLayoutService} from '../../../layout/layout.service';
import {VectorDataObject} from '../vector-data.type';

@Component({
  selector: 'hs-url-vector',
  templateUrl: 'vector-url.component.html',
})
export class HsAddDataVectorUrlComponent implements OnInit, OnDestroy {
  @Input() fileType: 'geojson' | 'kml' | 'gpx';
  @Input() app = 'default';

  data: VectorDataObject;
  private end = new Subject<void>();

  constructor(
    public hsHistoryListService: HsHistoryListService,
    public hsAddDataVectorService: HsAddDataVectorService,
    public hsAddDataCommonFileService: HsAddDataCommonFileService,
    public hsLayoutService: HsLayoutService
  ) {}
  connect = async (): Promise<void> => {
    const obtainable = await this.hsAddDataCommonFileService.isUrlObtainable(
      this.data.url,
      this.app
    );
    if (obtainable) {
      this.hsHistoryListService.addSourceHistory(this.fileType, this.data.url);
      this.data.showDetails = true;
    }
  };

  ngOnDestroy(): void {
    this.end.next();
    this.end.complete();
  }

  ngOnInit(): void {
    const commonFileServiceRef = this.hsAddDataCommonFileService.get(this.app);
    commonFileServiceRef.dataObjectChanged
      .pipe(takeUntil(this.end))
      .subscribe((data) => {
        this.data.showDetails = true;
        Object.assign(this.data, data);
        // this.clearInput();
      });
    this.setDataToDefault();
  }

  /**
   * Handler for adding non-wms service, file in template.
   */
  async add(): Promise<void> {
    const response: {layer; complete: boolean} =
      await this.hsAddDataVectorService.addNewLayer(this.data, this.app);
    if (response.complete) {
      this.hsLayoutService.setMainPanel('layermanager', this.app);
      this.setDataToDefault();
    }
  }
  /**
   * Reset data object to its default values
   */
  setDataToDefault(): void {
    this.data = {
      // Not possible to save KML to layman yet
      abstract: '',
      addUnder: null as Layer<Source>,
      base64url: '',
      extract_styles: false,
      featureCount: 0,
      features: [],
      folder_name: '',
      name: '',
      saveAvailable: false,
      saveToLayman: false,
      showDetails: false,
      serializedStyle: null,
      srs: 'EPSG:4326',
      title: '',
      type: this.fileType,
      url: undefined,
    };
  }
}
