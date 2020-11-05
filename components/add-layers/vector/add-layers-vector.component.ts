import {Component} from '@angular/core';

import {HsAddLayersVectorService} from './add-layers-vector.service';
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

  constructor(
    private HsAddLayersVectorService: HsAddLayersVectorService,
    private HsLayoutService: HsLayoutService
  ) {}

  /**
   * Handler for adding nonwms service, file in template.
   *
   * @function add
   */
  async add() {
    const layer = await this.HsAddLayersVectorService.addVectorLayer(
      '',
      this.url,
      this.title,
      this.abstract,
      this.srs,
      {extractStyles: this.extract_styles}
    );
    this.HsAddLayersVectorService.fitExtent(layer);
    this.HsLayoutService.setMainPanel('layermanager');
    return layer;
  }
}
