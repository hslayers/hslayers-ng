import {Component, OnInit, computed, input, inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {NgClass} from '@angular/common';

import {HsConfig} from 'hslayers-ng/config';
import {HsLayerEditorSublayerService} from './layer-editor-sub-layer.service';
import {HsLayerManagerVisibilityService} from 'hslayers-ng/services/layer-manager';
import {HsSublayer} from 'hslayers-ng/types';

@Component({
  selector: 'hs-layer-editor-sub-layer-checkbox',
  templateUrl: './layer-editor-sub-layer-checkboxes.component.html',
  imports: [FormsModule, NgClass],
})
export class HsLayerEditorSubLayerCheckboxesComponent implements OnInit {
  private hsLayerEditorSublayerService = inject(HsLayerEditorSublayerService);
  hsLayerManagerVisibilityService = inject(HsLayerManagerVisibilityService);
  private hsConfig = inject(HsConfig);

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

  ngOnInit() {
    this.app = this.hsConfig.id;
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
        sl.visible = sublayer.visible;
      });
    }
    return this.hsLayerEditorSublayerService.subLayerSelected();
  }
}
