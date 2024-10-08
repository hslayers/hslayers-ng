import {Component, computed, input} from '@angular/core';
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
  standalone: true,
  imports: [HsLayerEditorSubLayerCheckboxesComponent],
})
export class HsLayerEditorSublayersComponent {
  layer = input.required<HsLayerDescriptor>();
  subLayers = computed(() =>
    this.HsLayerEditorSublayerService.getSubLayers(this.layer()),
  );

  constructor(
    private HsLayerEditorSublayerService: HsLayerEditorSublayerService,
  ) {}
}
