import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {FormsModule} from '@angular/forms';
import {
  NgbDatepickerModule,
  NgbDropdownModule,
  NgbTooltipModule,
} from '@ng-bootstrap/ng-bootstrap';

import {FilterPipe} from 'hslayers-ng/common/pipes';
import {HsClusterWidgetComponent} from './widgets/cluster-widget.component';
import {HsColormapPickerModule} from 'hslayers-ng/common/color-map-picker';
import {HsCopyLayerDialogComponent} from './dialogs/copy-layer-dialog.component';
import {HsExtentWidgetComponent} from './widgets/extent-widget/extent-widget.component';
import {HsIdwWidgetComponent} from './widgets/idw-widget.component';
import {HsLayerEditorComponent} from './editor/layer-editor.component';
import {HsLayerEditorDimensionsComponent} from './dimensions/layer-editor-dimensions.component';
import {HsLayerEditorSubLayerCheckboxesComponent} from './editor/layer-editor-sub-layer-checkboxes.component';
import {HsLayerEditorWidgetBaseComponent} from './widgets/layer-editor-widget-base.component';
import {HsLayerListComponent} from './logical-list/layer-manager-layerlist.component';
import {HsLayerManagerComponent} from './layer-manager.component';
import {HsLayerManagerFolderComponent} from './logical-list/layer-manager-folder.component';
import {HsLayerManagerRemoveAllDialogComponent} from './dialogs/remove-all-dialog.component';
import {HsLayerManagerRemoveLayerDialogComponent} from './dialogs/remove-layer-dialog.component';
import {HsLayerManagerTimeEditorComponent} from './dimensions/layer-manager-time-editor.component';
import {HsLayerPhysicalListComponent} from './physical-list/physical-layerlist.component';
import {HsLegendModule} from 'hslayers-ng/components/legend';
import {HsLegendWidgetComponent} from './widgets/legend-widget.component';
import {HsMetadataWidgetComponent} from './widgets/metadata-widget.component';
import {HsOpacityWidgetComponent} from './widgets/opacity-widget.component';
import {HsPanelHeaderComponent} from 'hslayers-ng/common/panels';
import {HsPanelHelpersModule} from 'hslayers-ng/common/panels';
import {HsScaleWidgetComponent} from './widgets/scale-widget.component';
import {HsTypeWidgetComponent} from './widgets/type-widget.component';
import {HsWmsSourceWidgetComponent} from './widgets/wms-source-widget/wms-source-widget.component';
import {TranslateCustomPipe} from 'hslayers-ng/shared/language';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [
    HsLayerManagerComponent,
    HsLayerEditorDimensionsComponent,
    HsLayerEditorSubLayerCheckboxesComponent,
    HsLayerEditorComponent,
    HsLayerManagerFolderComponent,
    HsLayerListComponent,
    HsLayerManagerRemoveAllDialogComponent,
    HsCopyLayerDialogComponent,
    HsLayerManagerRemoveLayerDialogComponent,
    HsLayerManagerTimeEditorComponent,
    HsLayerEditorWidgetBaseComponent,
    HsLayerPhysicalListComponent,
    HsTypeWidgetComponent,
    HsMetadataWidgetComponent,
    HsScaleWidgetComponent,
    HsClusterWidgetComponent,
    HsIdwWidgetComponent,
    HsLegendWidgetComponent,
    HsOpacityWidgetComponent,
    HsExtentWidgetComponent,
  ],
  imports: [
    TranslateCustomPipe,
    CommonModule,
    FormsModule,
    HsPanelHelpersModule,
    HsLegendModule,
    NgbDatepickerModule,
    NgbDropdownModule,
    NgbTooltipModule,
    DragDropModule,
    HsColormapPickerModule,
    HsWmsSourceWidgetComponent,
    HsPanelHeaderComponent,
    FilterPipe,
  ],
  exports: [
    HsLayerManagerComponent,
    HsLayerEditorDimensionsComponent,
    HsLayerEditorSubLayerCheckboxesComponent,
    HsLayerEditorComponent,
    HsLayerManagerFolderComponent,
    HsLayerListComponent,
    HsLayerManagerRemoveAllDialogComponent,
    HsCopyLayerDialogComponent,
    HsLayerManagerRemoveLayerDialogComponent,
    HsLayerManagerTimeEditorComponent,
    HsLayerPhysicalListComponent,
    HsTypeWidgetComponent,
    HsMetadataWidgetComponent,
    HsScaleWidgetComponent,
    HsClusterWidgetComponent,
    HsLegendWidgetComponent,
    HsOpacityWidgetComponent,
    HsIdwWidgetComponent,
  ],
})
export class HsLayerManagerModule {}
