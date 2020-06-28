/**
 * @namespace hs.legend
 * @memberOf hs
 */
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from "@angular/common";
import { HsPanelHelpersModule } from '../layout/panel-helpers.module';
import { BrowserModule } from '@angular/platform-browser';
import { HsLayerManagerFolderComponent } from './layermanager-folder.component';
import { HsLayerEditorComponent } from './layer-editor.component';
import { HsLayerEditorDimensionsComponent } from './dimensions/layer-editor-dimensions.component';
import { HsLayerEditorService } from './layer-editor.service';
import { HsLayerEditorSubLayerCheckboxesComponent } from './layer-editor.sub-layer-checkboxes.component';
import { HsLayerEditorSublayerService } from './layer-editor.sub-layer.service';
import { HsLayerEditorVectorLayerService } from './layer-editor-vector-layer.service';
import { HsLayerListComponent } from './layermanager-layerlist.component';
import { HsLayerManagerComponent } from './layermanager.component';
import { HsLayerManagerGalleryComponent } from './layermanager-gallery.component';
import { HsLayerManagerMetadataService } from './layermanager-metadata.service';
import { HsLayerManagerService } from './layermanager.service';
import { HsLayerManagerWmstService } from './layermanager-wmst.service';
import { HsLayerManagerRemoveAllDialogComponent } from './remove-all-dialog.component';

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
    HsLayerManagerRemoveAllDialogComponent
  ],
  imports: [
    CommonModule,
    BrowserModule,
    HsPanelHelpersModule
  ],
  exports: [
    HsLayerManagerComponent,
    HsLayerEditorDimensionsComponent,
    HsLayerEditorSubLayerCheckboxesComponent,
    HsLayerManagerGalleryComponent,
    HsLayerEditorComponent,
    HsLayerManagerFolderComponent,
    HsLayerListComponent,
    HsLayerManagerRemoveAllDialogComponent
  ],
  providers: [
    HsLayerEditorSublayerService,
    HsLayerEditorService,
    HsLayerEditorVectorLayerService,
    HsLayerManagerMetadataService,
    HsLayerManagerService,
    HsLayerManagerWmstService
  ],
  entryComponents: [
    HsLayerManagerComponent,
    HsLayerEditorDimensionsComponent,
    HsLayerEditorSubLayerCheckboxesComponent,
    HsLayerManagerGalleryComponent,
    HsLayerEditorComponent,
    HsLayerManagerFolderComponent,
    HsLayerListComponent,
    HsLayerManagerRemoveAllDialogComponent
  ]
})
export class HsLayerManagerModule {
}


