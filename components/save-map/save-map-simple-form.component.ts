import {Component} from '@angular/core';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
@Component({
  selector: 'hs-save-map-simple-form',
  template: require('./partials/simpleform.html'),
})
export class HsSaveMapSimpleFormComponent {
  constructor(private HsLayerUtilsService: HsLayerUtilsService) {}
}
