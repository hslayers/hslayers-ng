import {CommonModule} from '@angular/common';
import {
  Component,
  OnInit,
  ViewContainerRef,
  computed,
  input,
  viewChild,
} from '@angular/core';
import {
  NgbProgressbarModule,
  NgbTooltipModule,
} from '@ng-bootstrap/ng-bootstrap';

import {HsConfig} from 'hslayers-ng/config';
import {HsDimensionTimeService} from 'hslayers-ng/services/get-capabilities';
import {HsLayerDescriptor} from 'hslayers-ng/types';
import {HsLayerEditorService} from '../../editor/layer-editor.service';
import {HsLayerListService} from '../layer-manager-layerlist.service';
import {
  HsLayerManagerService,
  HsLayerManagerVisibilityService,
  HsLayerSelectorService,
} from 'hslayers-ng/services/layer-manager';
import {HsLayerManagerTimeEditorComponent} from '../../dimensions/layer-manager-time-editor.component';
import {HsLayerUtilsService} from 'hslayers-ng/services/utils';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';
import {
  getExclusive,
  getHsLaymanSynchronizing,
} from 'hslayers-ng/common/extensions';

@Component({
  selector: 'hs-layer-list-item',
  templateUrl: './layer-list-item.component.html',
  standalone: true,
  imports: [
    CommonModule,
    NgbTooltipModule,
    NgbProgressbarModule,
    TranslateCustomPipe,
    HsLayerManagerTimeEditorComponent,
  ],
})
export class HsLayerListItemComponent implements OnInit {
  layer = input.required<HsLayerDescriptor>();

  isSelected = computed(
    () => this.hsLayerSelectorService.currentLayer === this.layer(),
  );

  abstract = computed(() =>
    this.hsLayerManagerService.makeSafeAndTranslate(
      'LAYERS',
      this.layer().abstract,
    ),
  );

  editor = viewChild('editor', {read: ViewContainerRef});
  sublayers = viewChild('sublayers', {read: ViewContainerRef});

  getExclusive = getExclusive;
  getHsLaymanSynchronizing = getHsLaymanSynchronizing;

  layerId = computed(() => this.layer().idString());

  isLayerQueryable = computed(() =>
    this.hsLayerListService.isLayerQueryable(this.layer()),
  );
  showLayerWmsT = computed(() =>
    this.hsDimensionTimeService.layerIsWmsT(this.layer()),
  );

  constructor(
    public hsConfig: HsConfig,
    private hsLayerManagerService: HsLayerManagerService,
    private hsLayerSelectorService: HsLayerSelectorService,
    private hsDimensionTimeService: HsDimensionTimeService,
    public hsLayerUtilsService: HsLayerUtilsService,
    private hsLayerListService: HsLayerListService,
    private hsLayerManagerVisibilityService: HsLayerManagerVisibilityService,
    private hsLayerEditorService: HsLayerEditorService,
  ) {}

  ngOnInit() {
    /**
     * Opens editor for layer specified in 'hs-layer-selected' url parameter
     */
    if (this.layer().layer.get('editorOnInit')) {
      this.toggleEditor();
      //Once editor is opened, set editorOnInit to false
      this.layer().layer.set('editorOnInit', false);
    }
  }

  toggleVisibility(): void {
    this.hsLayerManagerVisibilityService.changeLayerVisibility(
      !this.layer().visible,
      this.layer(),
    );
    this.hsLayerListService.toggleSublayersVisibility(this.layer());
  }

  /**
   * Toggles the layer editor for the current layer.
   * Creates or removes the layer editor component in the designated view container.
   */
  toggleEditor(): void {
    this.hsLayerEditorService.createLayerEditor(this.editor(), this.layer());
  }

  /**
   * Toggles the sublayer editor for the current layer.
   * Creates or removes the sublayer editor component in the designated view container.
   */
  toggleSublayers(): void {
    this.hsLayerEditorService.createSublayerEditor(
      this.sublayers(),
      this.layer(),
    );
  }
}
