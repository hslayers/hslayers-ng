import {Component} from '@angular/core';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import { HsSaveMapManagerService } from './save-map-manager.service';
@Component({
  selector: 'hs-save-map-simple-form',
  templateUrl: './partials/simpleform.html',
})
export class HsSaveMapSimpleFormComponent {
  constructor(public HsLayerUtilsService: HsLayerUtilsService, public HsSaveMapManagerService: HsSaveMapManagerService) {}
  isAllowed() {
    //TODO: Needs implementation
    return true;
  }
}
