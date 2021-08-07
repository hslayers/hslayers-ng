import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {FormsModule} from '@angular/forms';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {TranslateModule} from '@ngx-translate/core';

import {HsGetCapabilitiesModule} from '../../common/get-capabilities/get-capabilities.module';
import {HsLayerEditorComponent} from './layer-editor.component';
import {HsLayerEditorDimensionsComponent} from './dimensions/layer-editor-dimensions.component';
import {HsLayerEditorService} from './layer-editor.service';
import {HsLayerEditorSubLayerCheckboxesComponent} from './layer-editor.sub-layer-checkboxes.component';
import {HsLayerEditorSublayerService} from './layer-editor.sub-layer.service';
import {HsLayerEditorVectorLayerService} from './layer-editor-vector-layer.service';
import {HsLayerListComponent} from './layermanager-layerlist.component';
import {HsLayerManagerComponent} from './layermanager.component';
import {HsLayerManagerFolderComponent} from './layermanager-folder.component';
import {HsLayerManagerGalleryComponent} from './layermanager-gallery.component';
import {HsLayerManagerMetadataService} from './layermanager-metadata.service';
import {HsLayerManagerRemoveAllDialogComponent} from './remove-all-dialog.component';
import {HsLayerManagerRemoveLayerDialogComponent} from './remove-layer-dialog.component';
import {HsLayerManagerService} from './layermanager.service';
import {HsLayerManagerTimeEditorComponent} from './dimensions/layermanager-time-editor.component';
import {HsLayerManagerWmstService} from './layermanager-wmst.service';
import {HsLayerPhysicalListComponent} from './layermanager-physical-layerlist.component';
import {HsLayerSelectorService} from './layer-selector.service';
import {HsLayermanagerPhysicalListService} from './layermanager-physical-layerlist.service';
import {HsLegendModule} from '../legend/legend.module';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';
import {HsQueuesModule} from '../../common/queues/queues.module';
import {HsUiExtensionsModule} from '../../common/widgets/ui-extensions.module';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [
    HsLayerManagerComponent,
    HsLayerEditorDimensionsComponent,
    HsLayerEditorSubLayerCheckboxesComponent,
    HsLayerManagerGalleryComponent,
    HsLayerEditorComponent,
    HsLayerManagerFolderComponent,
    HsLayerListComponent,
    HsLayerManagerRemoveAllDialogComponent,
    HsLayerManagerRemoveLayerDialogComponent,
    HsLayerManagerTimeEditorComponent,
    HsLayerPhysicalListComponent,
  ],
  imports: [
    TranslateModule,
    CommonModule,
    FormsModule,
    HsGetCapabilitiesModule,
    HsPanelHelpersModule,
    HsLegendModule,
    HsUiExtensionsModule,
    NgbModule,
    DragDropModule,
    HsQueuesModule,
  ],
  exports: [
    HsLayerManagerComponent,
    HsLayerEditorDimensionsComponent,
    HsLayerEditorSubLayerCheckboxesComponent,
    HsLayerManagerGalleryComponent,
    HsLayerEditorComponent,
    HsLayerManagerFolderComponent,
    HsLayerListComponent,
    HsLayerManagerRemoveAllDialogComponent,
    HsLayerManagerRemoveLayerDialogComponent,
    HsLayerManagerTimeEditorComponent,
    HsLayerPhysicalListComponent,
  ],
  providers: [
    HsLayerEditorSublayerService,
    HsLayerEditorService,
    HsLayerEditorVectorLayerService,
    HsLayerManagerMetadataService,
    HsLayerManagerService,
    HsLayerManagerWmstService,
    HsLayerSelectorService,
    HsLayermanagerPhysicalListService,
  ],
  entryComponents: [
    HsLayerManagerComponent,
    HsLayerEditorDimensionsComponent,
    HsLayerEditorSubLayerCheckboxesComponent,
    HsLayerManagerGalleryComponent,
    HsLayerManagerFolderComponent,
    HsLayerListComponent,
    HsLayerManagerRemoveAllDialogComponent,
    HsLayerManagerRemoveLayerDialogComponent,
    HsLayerManagerTimeEditorComponent,
    HsLayerPhysicalListComponent,
  ],
})
export class HsLayerManagerModule {}
