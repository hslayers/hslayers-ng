import {Component, computed, input, inject} from '@angular/core';

import {HsLayerDescriptor} from 'hslayers-ng/types';
import {HsLayerEditorSubLayerCheckboxesComponent} from './layer-editor-sub-layer-checkboxes.component';
import {HsLayerEditorSublayerService} from './layer-editor-sub-layer.service';

@Component({
  selector: 'hs-layer-editor-sublayers',
  template: `
    <div class="card-body py-2">
      @for (subLayer of subLayers(); track subLayer) {
        <hs-layer-editor-sub-layer-checkbox [subLayer]="subLayer">
        </hs-layer-editor-sub-layer-checkbox>
      }
    </div>
  `,
  imports: [HsLayerEditorSubLayerCheckboxesComponent],
})
export class HsLayerEditorSublayersComponent {
  private hsLayerEditorSublayerService = inject(HsLayerEditorSublayerService);

  layer = input.required<HsLayerDescriptor>();
  subLayers = computed(() =>
    this.hsLayerEditorSublayerService.getSubLayers(this.layer()),
  );
}
