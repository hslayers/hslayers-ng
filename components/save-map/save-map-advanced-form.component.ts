import {Component} from '@angular/core';
import {HsSaveMapManagerService} from './save-map-manager.service';
@Component({
  selector: 'hs-save-map-advanced-form',
  template: require('./partials/form.html'),
})
export class HsSaveMapAdvancedFormComponent {
  btnSelectDeseletClicked = true;
  constructor(private HsSaveMapManagerService: HsSaveMapManagerService) {}

  selectDeselectAllLayers() {
    this.btnSelectDeseletClicked = !this.btnSelectDeseletClicked;
    this.HsSaveMapManagerService.compoData.layers.forEach(
      (layer) => (layer.checked = this.btnSelectDeseletClicked)
    );
  }
}
