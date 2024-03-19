import {Component, Input, OnInit} from '@angular/core';

import {HsConfig} from 'hslayers-ng/config';
import {
  HsLayerEditorSublayerService,
  KeyBooleanDict,
} from './layer-editor-sub-layer.service';
import {
  HsLayerManagerService,
  HsLayerManagerVisibilityService,
} from 'hslayers-ng/services/layer-manager';

@Component({
  selector: 'hs-layer-editor-sub-layer-checkbox',
  templateUrl: './layer-editor-sub-layer-checkboxes.component.html',
})
export class HsLayerEditorSubLayerCheckboxesComponent implements OnInit {
  @Input() subLayer: any;
  app: string;
  expanded = false;
  checkedSubLayers: KeyBooleanDict;
  withChildren: KeyBooleanDict;
  constructor(
    public HsLayerEditorSublayerService: HsLayerEditorSublayerService,
    public hsLayerManagerVisibilityService: HsLayerManagerVisibilityService,
    public HsLayerManagerService: HsLayerManagerService,
    private hsConfig: HsConfig,
  ) {}

  ngOnInit() {
    this.checkedSubLayers = this.HsLayerEditorSublayerService.checkedSubLayers;
    this.withChildren = this.HsLayerEditorSublayerService.withChildren;
    this.app = this.hsConfig.id;
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
   * Controls state of layer´s sublayers manipulated by input checkboxes
   * @param sublayer - Selected sublayer
   * @param state - New state of sublayer
   */
  subLayerSelected(sublayer?, state?) {
    //TODO: Check if this works where subLayerSelected() is called from template. The second 'if' might fail
    if (sublayer != undefined && sublayer.Layer) {
      for (const children of sublayer.Layer) {
        const nameOrId = children.Name;
        const sublayersObject = children.Layer
          ? this.withChildren
          : this.checkedSubLayers;
        Object.assign(sublayersObject, {
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
