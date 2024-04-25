import {AsyncPipe, KeyValuePipe, NgIf} from '@angular/common';
import {Component, ElementRef, OnInit, ViewChild, inject} from '@angular/core';
import {FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import {HsLayerEditorWidgetBaseComponent} from '../layer-editor-widget-base.component';
import {
  HsLayerManagerFolderService,
  HsLayerManagerService,
  HsLayerSelectorService,
} from 'hslayers-ng/services/layer-manager';
import {Observable, map} from 'rxjs';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';
import {getPath, setPath} from 'hslayers-ng/common/extensions';

@Component({
  selector: 'hs-layer-folder-widget',
  standalone: true,
  imports: [NgIf, AsyncPipe, TranslateCustomPipe, ReactiveFormsModule],
  templateUrl: './layer-folder-widget.component.html',
  styleUrl: './layer-folder-widget.component.css',
})
export class LayerFolderWidgetComponent
  extends HsLayerEditorWidgetBaseComponent
  implements OnInit {
  hsLayermanagerService = inject(HsLayerManagerService);
  folderService = inject(HsLayerManagerFolderService);
  @ViewChild('pathInput', {static: false}) pathInput: ElementRef;

  isEnabled: Observable<boolean>;

  pathControl = new FormControl('', [
    Validators.required,
    Validators.minLength(1),
  ]);
  availableFolders: Observable<string[]>;
  constructor(hsLayerSelectorService: HsLayerSelectorService) {
    super(hsLayerSelectorService);

    this.isEnabled = this.layerDescriptor.pipe(
      map((layer) => {
        return !!layer.layer;
      }),
    );
  }

  ngOnInit(): void {
    super.ngOnInit();
    this.availableFolders = this.hsLayermanagerService.data.folders$.pipe(
      map((foldersMap) => {
        return [...foldersMap.entries()].reduce((acc, [key, value]) => {
          return key !== getPath(this.olLayer) ? [...acc, key] : acc;
        }, []);
      }),
    );
  }

  /**
   * Move layer to the selected folder
   */
  moveLayerToNewFolder() {
    if (this.pathControl.valid) {
      this.folderService.folderAction$.next(
        this.folderService.removeLayer(
          this.hsLayerSelectorService.currentLayer,
        ),
      );
      setPath(this.olLayer, this.pathControl.value);
      this.folderService.folderAction$.next(
        this.folderService.addLayer(this.hsLayerSelectorService.currentLayer),
      );
      this.folderService.folderAction$.next(this.folderService.sortByZ());
    }
  }
}
