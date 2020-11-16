import {Component, Input} from '@angular/core';
import {HsLayerEditorSublayerService} from './layer-editor.sub-layer.service';
@Component({
  selector: 'hs-layer-editor-sub-layer-checkbox',
  templateUrl: './partials/sub-layer-checkboxes.html',
})
export class HsLayerEditorSubLayerCheckboxesComponent {
  @Input() subLayer: any;
  expanded = false;
  checkedSubLayers: any;
  withChildren: any;

  constructor(
    private HsLayerEditorSublayerService: HsLayerEditorSublayerService
  ) {
    this.checkedSubLayers = this.HsLayerEditorSublayerService.checkedSubLayers;
    this.withChildren = this.HsLayerEditorSublayerService.withChildren;
  }

  getSubLayers() {
    return this.HsLayerEditorSublayerService.getSubLayers();
  }

  subLayerIsString(subLayer: any): boolean {
    return typeof subLayer == 'string';
  }

  toggleExpanded(): void {
    this.expanded = !this.expanded;
  }

  /**
   * @function toggleSublayersVisibility
   * @memberOf hs.layermanager.layer-editor.sub-layer-checkboes
   * @description Controls state of layer´s sublayers manipulated by input checkboxes
   * @param {object} sublayer Selected sublayer
   * @param {object} state New state of sublayer
   */
  subLayerSelected(sublayer, state) {
    if (sublayer != undefined && sublayer.Layer) {
      for (const children of sublayer.Layer) {
        Object.assign(this.checkedSubLayers, {
          [children.Name]: state,
        });
        this.HsLayerEditorSublayerService.checkedSubLayersTmp[
          children.Name
        ] = state;
      }
    }
    if (this.checkedSubLayers[sublayer.Name] != undefined) {
      this.HsLayerEditorSublayerService.checkedSubLayersTmp[
        sublayer.Name
      ] = state;
    } else {
      this.HsLayerEditorSublayerService.withChildrenTmp[sublayer.Name] = state;
    }
    return this.HsLayerEditorSublayerService.subLayerSelected();
  }
}
