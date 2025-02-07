import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {FormsModule} from '@angular/forms';
import {
  NgbDatepickerModule,
  NgbDropdownModule,
  NgbProgressbarModule,
  NgbTooltipModule,
} from '@ng-bootstrap/ng-bootstrap';

import {FilterPipe} from 'hslayers-ng/common/pipes';
import {HsClipboardTextComponent} from 'hslayers-ng/common/clipboard-text';
import {HsClusterWidgetComponent} from './widgets/cluster-widget.component';
import {HsColormapPickerModule} from 'hslayers-ng/common/color-map-picker';
import {HsCopyLayerDialogComponent} from './dialogs/copy-layer-dialog.component';
import {HsExtentWidgetComponent} from './widgets/extent-widget/extent-widget.component';
import {HsIdwWidgetComponent} from './widgets/idw-widget.component';
import {HsLayerEditorDimensionsComponent} from './dimensions/layer-editor-dimensions.component';
import {HsLayerEditorWidgetBaseComponent} from './widgets/layer-editor-widget-base.component';
import {HsLayerFolderWidgetComponent} from './widgets/layer-folder-widget/layer-folder-widget.component';
import {HsLayerListComponent} from './logical-list/layer-manager-layerlist.component';
import {HsLayerManagerComponent} from './layer-manager.component';
import {HsLayerManagerRemoveAllDialogComponent} from './dialogs/remove-all-dialog.component';
import {HsLayerManagerRemoveLayerDialogComponent} from './dialogs/remove-layer-dialog.component';
import {HsLayerPhysicalListComponent} from './physical-list/physical-layerlist.component';
import {HsLegendModule} from 'hslayers-ng/components/legend';
import {HsLegendWidgetComponent} from './widgets/legend-widget.component';
import {HsMetadataWidgetComponent} from './widgets/metadata-widget.component';
import {HsOpacityWidgetComponent} from './widgets/opacity-widget.component';
import {
  HsPanelHeaderComponent,
  HsPanelHelpersModule,
} from 'hslayers-ng/common/panels';
import {HsScaleWidgetComponent} from './widgets/scale-widget.component';
import {HsTypeWidgetComponent} from './widgets/type-widget.component';
import {HsWmsSourceWidgetComponent} from './widgets/wms-source-widget/wms-source-widget.component';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [
    HsLayerManagerComponent,
    HsLayerEditorDimensionsComponent,
    HsLayerManagerRemoveAllDialogComponent,
    HsCopyLayerDialogComponent,
    HsLayerManagerRemoveLayerDialogComponent,
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
    HsLayerListComponent,
    TranslateCustomPipe,
    CommonModule,
    FormsModule,
    HsPanelHelpersModule,
    HsLegendModule,
    NgbDatepickerModule,
    NgbDropdownModule,
    NgbTooltipModule,
    NgbProgressbarModule,
    DragDropModule,
    HsColormapPickerModule,
    HsWmsSourceWidgetComponent,
    HsLayerFolderWidgetComponent,
    HsPanelHeaderComponent,
    FilterPipe,
    HsClipboardTextComponent,
  ],
  exports: [
    HsLayerManagerComponent,
    HsLayerEditorDimensionsComponent,
    HsLayerListComponent,
    HsLayerManagerRemoveAllDialogComponent,
    HsCopyLayerDialogComponent,
    HsLayerManagerRemoveLayerDialogComponent,
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
