import {Component, DestroyRef, Input, OnInit, inject} from '@angular/core';

import {Layer} from 'ol/layer';
import {Source} from 'ol/source';

import {HsAddDataCommonFileService} from 'hslayers-ng/services/add-data';
import {HsAddDataVectorService} from 'hslayers-ng/services/add-data';
import {HsHistoryListService} from 'hslayers-ng/common/history-list';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {VectorDataObject} from 'hslayers-ng/types';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

@Component({
  selector: 'hs-url-vector',
  templateUrl: 'vector-url.component.html',
})
export class HsAddDataVectorUrlComponent implements OnInit {
  @Input() fileType: 'geojson' | 'kml' | 'gpx';

  data: VectorDataObject;
  private destroyRef = inject(DestroyRef);

  constructor(
    public hsHistoryListService: HsHistoryListService,
    public hsAddDataVectorService: HsAddDataVectorService,
    public hsAddDataCommonFileService: HsAddDataCommonFileService,
    public hsLayoutService: HsLayoutService,
  ) {}
  connect = async (): Promise<void> => {
    const obtainable = await this.hsAddDataCommonFileService.isUrlObtainable(
      this.data.url,
    );
    if (obtainable) {
      this.hsHistoryListService.addSourceHistory(this.fileType, this.data.url);
      this.data.showDetails = true;
    }
  };

  ngOnInit(): void {
    this.hsAddDataCommonFileService.dataObjectChanged
      .pipe(takeUntilDestroyed(this.destroyRef))
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
      await this.hsAddDataVectorService.addNewLayer(this.data);
    if (response.complete) {
      this.hsLayoutService.setMainPanel('layerManager');
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
      allowedStyles: 'sldqml',
    };
  }
}
