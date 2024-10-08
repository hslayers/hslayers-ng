import {Component, OnInit, computed, input} from '@angular/core';

import {FormsModule} from '@angular/forms';
import {HsConfig} from 'hslayers-ng/config';
import {HsLayerEditorSublayerService} from './layer-editor-sub-layer.service';
import {
  HsLayerManagerService,
  HsLayerManagerVisibilityService,
} from 'hslayers-ng/services/layer-manager';
import {HsSublayer} from 'hslayers-ng/types';
import {NgClass} from '@angular/common';

@Component({
  selector: 'hs-layer-editor-sub-layer-checkbox',
  templateUrl: './layer-editor-sub-layer-checkboxes.component.html',
  standalone: true,
  imports: [FormsModule, NgClass],
})
export class HsLayerEditorSubLayerCheckboxesComponent implements OnInit {
  parent = input<HsSublayer>();
  subLayer = input.required<HsSublayer>();

  getNestedLayers = computed(() => {
    const wmsLayer = this.subLayer();
    if (!wmsLayer || !wmsLayer.sublayers) {
      return [];
    }
    return Array.isArray(wmsLayer.sublayers)
      ? wmsLayer.sublayers
      : [wmsLayer.sublayers];
  });

  app: string;
  expanded = false;

  constructor(
    public HsLayerEditorSublayerService: HsLayerEditorSublayerService,
    public hsLayerManagerVisibilityService: HsLayerManagerVisibilityService,
    public HsLayerManagerService: HsLayerManagerService,
    private hsConfig: HsConfig,
  ) {}

  ngOnInit() {
    this.app = this.hsConfig.id;
  }

  getSubLayers() {
    //return this.HsLayerEditorSublayerService.getSubLayers();
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
  subLayerSelected(sublayer: HsSublayer, parent?: HsSublayer) {
    if (parent) {
      parent.visible =
        sublayer.visible || parent.sublayers.some((sl) => sl.visible);
    }
    if (sublayer.sublayers) {
      sublayer.sublayers.forEach((sl) => {
        sl.visible = sublayer.visible; //TODO previous state
      });
    }
    return this.HsLayerEditorSublayerService.subLayerSelected();
  }
}
