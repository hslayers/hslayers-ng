import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {FormsModule} from '@angular/forms';
import {
  NgbDatepickerModule,
  NgbDropdownModule,
  NgbTooltipModule,
} from '@ng-bootstrap/ng-bootstrap';

import {HsClusterWidgetComponent} from './widgets/cluster-widget.component';
import {HsColormapPickerModule} from '../../common/color-map-picker/colormap-picker.module';
import {HsCopyLayerDialogComponent} from './dialogs/copy-layer-dialog.component';
import {HsExtentWidgetComponent} from './widgets/extent-widget/extent-widget.component';
import {HsIdwWidgetComponent} from './widgets/idw-widget.component';
import {HsLayerEditorComponent} from './editor/layer-editor.component';
import {HsLayerEditorDimensionsComponent} from './dimensions/layer-editor-dimensions.component';
import {HsLayerEditorSubLayerCheckboxesComponent} from './editor/layer-editor-sub-layer-checkboxes.component';
import {HsLayerEditorWidgetBaseComponent} from './widgets/layer-editor-widget-base.component';
import {HsLayerListComponent} from './logical-list/layermanager-layerlist.component';
import {HsLayerManagerComponent} from './layermanager.component';
import {HsLayerManagerFolderComponent} from './logical-list/layermanager-folder.component';
import {HsLayerManagerRemoveAllDialogComponent} from './dialogs/remove-all-dialog.component';
import {HsLayerManagerRemoveLayerDialogComponent} from './dialogs/remove-layer-dialog.component';
import {HsLayerManagerTimeEditorComponent} from './dimensions/layermanager-time-editor.component';
import {HsLayerPhysicalListComponent} from './physical-list/physical-layerlist.component';
import {HsLegendModule} from '../legend/legend.module';
import {HsLegendWidgetComponent} from './widgets/legend-widget.component';
import {HsMetadataWidgetComponent} from './widgets/metadata-widget.component';
import {HsOpacityWidgetComponent} from './widgets/opacity-widget.component';
import {HsPanelHeaderComponent} from '../layout/panels/panel-header/panel-header.component';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';
import {HsQueuesModule} from '../../common/queues/queues.module';
import {HsScaleWidgetComponent} from './widgets/scale-widget.component';
import {HsTypeWidgetComponent} from './widgets/type-widget.component';
import {HsUiExtensionsModule} from '../../common/widgets/ui-extensions.module';
import {HsWmsSourceWidgetComponent} from './widgets/wms-source-widget/wms-source-widget.component';
import {TranslateCustomPipe} from '../language/translate-custom.pipe';

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
    HsUiExtensionsModule,
    NgbDatepickerModule,
    NgbDropdownModule,
    NgbTooltipModule,
    DragDropModule,
    HsQueuesModule,
    HsColormapPickerModule,
    HsWmsSourceWidgetComponent,
    HsPanelHeaderComponent,
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
