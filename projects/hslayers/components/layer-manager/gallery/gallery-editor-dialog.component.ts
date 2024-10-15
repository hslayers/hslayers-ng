import {AsyncPipe, CommonModule} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  Signal,
  ViewContainerRef,
  ViewRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';

import {HsDialogComponent} from 'hslayers-ng/common/dialogs';
import {HsDialogContainerService} from 'hslayers-ng/common/dialogs';
import {HsLayerDescriptor} from 'hslayers-ng/types';
import {HsLayerEditorService} from '../editor/layer-editor.service';
import {HsLayerManagerService} from 'hslayers-ng/services/layer-manager';
import {Observable, filter, map, startWith} from 'rxjs';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';
import {getBase} from 'hslayers-ng/common/extensions';
import {
  takeUntilDestroyed,
  toObservable,
  toSignal,
} from '@angular/core/rxjs-interop';

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
              {{ title | async | translateHs: 'LAYERS' }}
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
            <ng-container #editor> </ng-container>
          </div>
        </div>
      </div>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, TranslateCustomPipe, AsyncPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HsGalleryEditorDialogComponent
  implements HsDialogComponent, OnInit
{
  @Input() data: {layer: HsLayerDescriptor};
  title: Observable<string>;
  viewRef: ViewRef;

  editor = viewChild('editor', {read: ViewContainerRef});

  private hsDialogContainerService = inject(HsDialogContainerService);
  private hsLayerEditorService = inject(HsLayerEditorService);
  private hsLayerManagerService = inject(HsLayerManagerService);

  constructor() {
    toObservable(this.hsLayerManagerService.data.folders)
      .pipe(
        filter((_) => !getBase(this.data.layer.layer)),
        takeUntilDestroyed(),
      )
      .subscribe((folders) => {
        this.close();
      });
  }

  close() {
    this.hsLayerEditorService.createLayerEditor(this.editor(), this.data.layer);
    this.hsDialogContainerService.destroy(this);
  }

  ngOnInit() {
    this.hsLayerEditorService.createLayerEditor(this.editor(), this.data.layer);
    this.title = this.hsLayerEditorService.layerTitleChange.pipe(
      map((event) => event.newTitle),
      startWith(this.data.layer.title),
    );
  }
}
