import {Component, Input, OnDestroy, OnInit} from '@angular/core';

import {Layer} from 'ol/layer';
import {Source} from 'ol/source';

import {HsAddDataCommonFileService} from '../../common/common-file.service';
import {HsAddDataVectorService} from '../vector.service';
import {HsHistoryListService} from '../../../../common/history-list/history-list.service';
import {HsLayoutService} from '../../../layout/layout.service';
import {Subject, takeUntil} from 'rxjs';
import {VectorDataObject} from '../vector-data.type';

@Component({
  selector: 'hs-url-vector',
  templateUrl: 'vector-url.component.html',
})
export class HsAddDataVectorUrlComponent implements OnInit, OnDestroy {
  @Input() dataType: 'geojson' | 'kml' | 'gpx';
  @Input() app = 'default';

  data: VectorDataObject;
  private ngUnsubscribe = new Subject<void>();

  constructor(
    public hsHistoryListService: HsHistoryListService,
    public hsAddDataVectorService: HsAddDataVectorService,
    public hsAddDataCommonFileService: HsAddDataCommonFileService,
    public hsLayoutService: HsLayoutService
  ) {}
  connect = async (): Promise<void> => {
    this.hsHistoryListService.addSourceHistory(this.dataType, this.data.url);
    this.data.showDetails = true;
  };

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  ngOnInit(): void {
    const commonFileServiceAppRef = this.hsAddDataCommonFileService.get(
      this.app
    );
    commonFileServiceAppRef.dataObjectChanged
      .pipe(takeUntil(this.ngUnsubscribe))
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
    await this.hsAddDataVectorService.addNewLayer(this.data, this.app);
    this.hsLayoutService.setMainPanel('layermanager', this.app);
    this.setDataToDefault();
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
      sld: null,
      srs: 'EPSG:4326',
      title: '',
      type: '',
      dataType: this.dataType,
      url: undefined,
    };
  }
}
