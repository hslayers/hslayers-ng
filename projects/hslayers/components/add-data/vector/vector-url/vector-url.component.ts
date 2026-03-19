import {Component, DestroyRef, Input, OnInit, inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

import Layer from 'ol/layer/Layer';
import Source from 'ol/source/Source';

import {
  HsAddDataCommonFileService,
  HsAddDataVectorService,
} from 'hslayers-ng/services/add-data';
import {HsAddToMapButtonComponent} from 'hslayers-ng/common/add-to-map';
import {HsCommonUrlComponent} from '../../common/url/url.component';
import {HsHistoryListService} from 'hslayers-ng/common/history-list';
import {HsNewLayerFormComponent} from '../../common/new-layer-form/new-layer-form.component';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {VectorDataObject} from 'hslayers-ng/types';

@Component({
  selector: 'hs-url-vector',
  templateUrl: 'vector-url.component.html',
  imports: [
    FormsModule,
    HsCommonUrlComponent,
    HsNewLayerFormComponent,
    HsAddToMapButtonComponent,
  ],
})
export class HsAddDataVectorUrlComponent implements OnInit {
  hsHistoryListService = inject(HsHistoryListService);
  hsAddDataVectorService = inject(HsAddDataVectorService);
  hsAddDataCommonFileService = inject(HsAddDataCommonFileService);
  hsLayoutService = inject(HsLayoutService);

  @Input() fileType: 'geojson' | 'kml' | 'gpx';

  data: VectorDataObject;
  private destroyRef = inject(DestroyRef);

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
