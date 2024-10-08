import {
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  Input,
  OnInit,
  ViewContainerRef,
  ViewRef,
  inject,
  viewChild,
} from '@angular/core';
import {CommonModule} from '@angular/common';

import {HsDialogComponent} from 'hslayers-ng/common/dialogs';
import {HsDialogContainerService} from 'hslayers-ng/common/dialogs';
import {HsLayerDescriptor} from 'hslayers-ng/types';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';

import {HsLayerEditorComponent} from '../editor/layer-editor.component';
import {HsLayerEditorService} from '../editor/layer-editor.service';
import {HsStylerPartBaseComponent} from '../../../services/styler/style-part-base.component';

@Component({
  selector: 'hs-gallery-editor-dialog',
  template: `
    <div
      class="modal in hs-set-permissions-dialog"
      tabindex="-1"
      role="dialog"
      aria-hidden="true"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h4 class="modal-title text-truncate">
              {{ title | translateHs: 'LAYERS' }}
            </h4>
            <button
              type="button"
              (click)="close()"
              class="btn-close"
              data-dismiss="modal"
              [attr.aria-label]="'COMMON.close' | translateHs"
            ></button>
          </div>
          <div class="modal-body" style="overflow-y:auto">
            <ng-component #editor> </ng-component>
          </div>
        </div>
      </div>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, TranslateCustomPipe, HsStylerPartBaseComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HsGalleryEditorDialogComponent
  implements HsDialogComponent, OnInit
{
  @Input() data: {layer: HsLayerDescriptor};
  title: string;
  viewRef: ViewRef;

  editor = viewChild('editor', {read: ViewContainerRef});
  editorComponent: ComponentRef<HsLayerEditorComponent>;

  private hsDialogContainerService = inject(HsDialogContainerService);
  private hsLayerEditorService = inject(HsLayerEditorService);

  close() {
    this.hsLayerEditorService.createLayerEditor(this.editor(), this.data.layer);
    this.hsDialogContainerService.destroy(this);
  }

  ngOnInit() {
    this.editorComponent = this.hsLayerEditorService.createLayerEditor(
      this.editor(),
      this.data.layer,
    );
    this.title = this.data.layer.title;
  }
}
