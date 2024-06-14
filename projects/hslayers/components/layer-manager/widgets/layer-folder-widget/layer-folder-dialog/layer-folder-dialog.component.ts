import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  QueryList,
  Signal,
  ViewChild,
  ViewChildren,
  ViewRef,
  computed,
  inject,
} from '@angular/core';
import {AsyncPipe, NgIf} from '@angular/common';
import {FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';
import {Observable, debounceTime, filter, fromEvent} from 'rxjs';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

import {Layer} from 'ol/layer';

import {
  HsLanguageService,
  TranslateCustomPipe,
} from 'hslayers-ng/services/language';

import {
  HsDialogComponent,
  HsDialogContainerService,
  HsDialogItem,
} from 'hslayers-ng/common/dialogs';
import {
  HsLayerManagerFolderService,
  HsLayerManagerService,
} from 'hslayers-ng/services/layer-manager';
import {getPath} from 'hslayers-ng/common/extensions';

@Component({
  selector: 'hs-layer-folder-widget-dialog',
  standalone: true,
  imports: [
    NgIf,
    AsyncPipe,
    TranslateCustomPipe,
    ReactiveFormsModule,
    NgbDropdownModule,
  ],
  templateUrl: './layer-folder-dialog.component.html',
  styles: `
    .hs-folder-widget-dialog-list * {
      cursor: pointer;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayerFolderWidgetDialogComponent
  implements HsDialogComponent, OnInit, AfterViewInit {
  data: {
    layer: Layer;
  };

  viewRef: ViewRef;
  dialogItem: HsDialogItem;

  hsLayermanagerService = inject(HsLayerManagerService);
  folderService = inject(HsLayerManagerFolderService);
  languageService = inject(HsLanguageService);
  hsDialogContainerService = inject(HsDialogContainerService);
  destroyRef = inject(DestroyRef);

  @ViewChild('pathInput', {static: false}) pathInput: ElementRef;
  @ViewChildren('pathRadio') pathRadios: QueryList<ElementRef>;

  isEnabled: Observable<boolean>;

  pathControl = new FormControl('', [
    Validators.required,
    Validators.minLength(1),
  ]);
  availableFolders: Signal<string[]>;

  constructor() {}

  ngOnInit(): void {
    this.availableFolders = computed(() => {
      const folders = this.hsLayermanagerService.data.folders();
      return [...folders.entries()].reduce((acc, [key, value]) => {
        return key !== getPath(this.data.layer) ? [...acc, key] : acc;
      }, []);
    });

    this.pathControl.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((v) => this.availableFolders().includes(v)),
      )
      .subscribe((val) => {
        this.pathInput.nativeElement.value = null;
      });
  }

  ngAfterViewInit() {
    fromEvent(this.pathInput.nativeElement, 'input')
      .pipe(takeUntilDestroyed(this.destroyRef), debounceTime(250))
      .subscribe((input) => {
        this.pathRadios.forEach((r) => (r.nativeElement.checked = false));
      });
  }

  yes(): void {
    this.hsDialogContainerService.destroy(this);
    this.dialogItem.resolve(this.pathControl.valid ? this.pathControl : false);
  }

  no(): void {
    this.hsDialogContainerService.destroy(this);
    this.dialogItem.resolve(false);
  }
}
