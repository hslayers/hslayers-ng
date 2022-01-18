import {Component, Input} from '@angular/core';
import {
  HsLayerEditorSublayerService,
  KeyBooleanDict,
} from './layer-editor.sub-layer.service';
import {HsLayerManagerService} from '../layermanager.service';

@Component({
  selector: 'hs-layer-editor-sub-layer-checkbox',
  templateUrl: './sub-layer-checkboxes.html',
})
export class HsLayerEditorSubLayerCheckboxesComponent {
  @Input() subLayer: any;
  expanded = false;
  checkedSubLayers: KeyBooleanDict;
  withChildren: KeyBooleanDict;

  constructor(
    public HsLayerEditorSublayerService: HsLayerEditorSublayerService,
    public HsLayerManagerService: HsLayerManagerService
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
   * @description Controls state of layer´s sublayers manipulated by input checkboxes
   * @param {object} sublayer Selected sublayer
   * @param {object} state New state of sublayer
   */
  subLayerSelected(sublayer?, state?) {
    //TODO: Check if this works where subLayerSelected() is called from template. The second 'if' might fail
    if (sublayer != undefined && sublayer.Layer) {
      for (const children of sublayer.Layer) {
        const nameOrId = children.Name;
        Object.assign(this.checkedSubLayers, {
          [nameOrId]: state,
        });
        this.HsLayerEditorSublayerService.checkedSubLayersTmp[nameOrId] = state;
      }
    }
    const nameOrId = sublayer.Name; //ID is stored in Name prop for ArcGISREST
    if (this.checkedSubLayers[nameOrId] != undefined) {
      this.HsLayerEditorSublayerService.checkedSubLayersTmp[nameOrId] = state;
    } else {
      this.HsLayerEditorSublayerService.withChildrenTmp[nameOrId] = state;
    }
    return this.HsLayerEditorSublayerService.subLayerSelected();
  }
}
