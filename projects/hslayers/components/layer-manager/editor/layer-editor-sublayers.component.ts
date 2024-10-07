import {Component, Input} from '@angular/core';
import {HsLayerDescriptor} from 'hslayers-ng/types';
import {HsLayerEditorSublayerService} from './layer-editor-sub-layer.service';

@Component({
  selector: 'hs-layer-editor-sublayers',
  template: `
    <div class="card-body">
      <div class="form-group">
        @for (subLayer of getSubLayers(); track subLayer) {
          <div>
            <hs-layer-editor-sub-layer-checkbox [subLayer]="subLayer">
            </hs-layer-editor-sub-layer-checkbox>
          </div>
        }
      </div>
    </div>
  `,
})
export class HsLayerEditorSublayersComponent {
  @Input() layer: HsLayerDescriptor;

  constructor(
    private HsLayerEditorSublayerService: HsLayerEditorSublayerService,
  ) {}

  getSubLayers() {
    return this.HsLayerEditorSublayerService.getSubLayers();
  }
}
