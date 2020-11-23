import {Component} from '@angular/core';

import {HsAddLayersVectorService} from './add-layers-vector.service';
import {HsHistoryListService} from '../../../common/history-list/history-list.service';
import {HsLayoutService} from '../../layout/layout.service';

@Component({
  selector: 'hs-add-layers-vector',
  template: require('./add-vector-layer.directive.html'),
})
export class HsAddLayersVectorComponent {
  srs = 'EPSG:4326';
  title = '';
  extract_styles = false;
  abstract: string;
  url: string;
  name = '';
  advancedPanelVisible = false;
  folder_name = '';

  constructor(
    public hsAddLayersVectorService: HsAddLayersVectorService,
    public hsHistoryListService: HsHistoryListService,
    public hsLayoutService: HsLayoutService
  ) {}

  connect = (): void => {
    this.hsHistoryListService.addSourceHistory('vector', this.url);
    //this.showDetails = true;
  };

  /**
   * Handler for adding nonwms service, file in template.
   *
   * @function add
   */
  async add() {
    const layer = await this.hsAddLayersVectorService.addVectorLayer(
      '',
      this.url,
      this.name,
      this.title,
      this.abstract,
      this.srs,
      {extractStyles: this.extract_styles}
    );
    this.hsAddLayersVectorService.fitExtent(layer);
    this.hsLayoutService.setMainPanel('layermanager');
    return layer;
  }
}
