import {Component, Input, OnInit, ViewRef, inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {NgClass} from '@angular/common';
import {TranslatePipe} from '@ngx-translate/core';

import {FeatureLike} from 'ol/Feature';
import {VectorSourceEvent} from 'ol/source/Vector';

import {AccessRightsModel} from 'hslayers-ng/types';
import {
  HsDialogComponent,
  HsDialogContainerService,
} from 'hslayers-ng/common/dialogs';
import {HsDrawService} from 'hslayers-ng/services/draw';
import {
  HsCommonLaymanAccessRightsComponent,
  HsCommonLaymanService,
  HsLaymanCurrentUserComponent,
  awaitLayerSync,
  getLaymanFriendlyLayerName,
} from 'hslayers-ng/common/layman';
import {HsMapService} from 'hslayers-ng/services/map';
import {
  getEditor,
  getPath,
  getTitle,
  setAccessRights,
  setEditor,
  setName,
  setPath,
  setTitle,
} from 'hslayers-ng/common/extensions';

@Component({
  selector: 'hs-draw-layer-metadata',
  templateUrl: './draw-layer-metadata.component.html',
  imports: [
    NgClass,
    FormsModule,
    TranslatePipe,
    HsLaymanCurrentUserComponent,
    HsCommonLaymanAccessRightsComponent,
  ],
})
export class HsDrawLayerMetadataDialogComponent
  implements HsDialogComponent, OnInit
{
  hsMapService = inject(HsMapService);
  hsDialogContainerService = inject(HsDialogContainerService);
  hsCommonLaymanService = inject(HsCommonLaymanService);
  hsDrawService = inject(HsDrawService);

  @Input() data: object;

  newLayerPath: string;
  attributes: Array<{id: number; name: string; value: string}> = [];
  layer = this.hsDrawService.selectedLayer;

  title: string;
  path: string;
  folderVisible = false;
  type: 'draw' | 'layman' = 'draw';

  access_rights: AccessRightsModel = {
    'access_rights.write': 'private',
    'access_rights.read': 'EVERYONE',
  };
  onlyMineFilterVisible = false;
  tmpFeatures: FeatureLike[] = [];
  viewRef: ViewRef;

  ngOnInit(): void {
    this.title = getTitle(this.layer) || '';
    this.path = getPath(this.layer) || '';
    this.tmpFeatures = this.layer.getSource().getFeatures();
  }

  titleChanged(): void {
    if (this.title) {
      setTitle(this.layer, this.title);
    }
  }

  confirm(): void {
    try {
      const dic = {};

      setName(this.layer, getLaymanFriendlyLayerName(getTitle(this.layer)));
      const tmpLayer =
        this.hsMapService.findLayerByTitle('tmpDrawLayer') || null;
      if (tmpLayer) {
        this.hsMapService.getMap().removeLayer(tmpLayer);
      }

      this.attributes.forEach((a) => {
        if (a.name && a.name.trim() !== '') {
          dic[a.name] = a.value;
        }
      });

      let editorConfig = getEditor(this.layer);
      if (!editorConfig) {
        editorConfig = {};
        setEditor(this.layer, editorConfig);
      }
      editorConfig.defaultAttributes = dic;

      this.layer.getSource().forEachFeature((f) => {
        f.setProperties(dic);
      });

      setAccessRights(this.layer, this.access_rights);
      this.hsDrawService.changeDrawSource();

      this.hsDrawService.addDrawLayer(this.layer);
      this.hsDrawService.fillDrawableLayers();
      this.tmpFeatures = this.layer.getSource().getFeatures();

      //Dispatch add feature event in order to trigger sync
      awaitLayerSync(this.layer).then(() => {
        const event = this.getFeatureEvent();
        this.layer.getSource().dispatchEvent(event);
        this.hsDrawService.tmpDrawLayer = false;
        this.hsDialogContainerService.destroy(this);
      });
    } catch (error) {
      console.error('Error in confirm method:', error);
      this.hsDrawService.tmpDrawLayer = false;
      this.hsDialogContainerService.destroy(this);
    }
  }

  /**
   * Creates an event for the feature event.
   * If the layer is new, the event is 'addfeature'.
   * If the layer is existing, the event is a VectorSourceEvent with the features.
   */
  getFeatureEvent() {
    return this.tmpFeatures &&
      this.layer.getSource().getFeatures().length > this.tmpFeatures.length
      ? new VectorSourceEvent('addfeatures', undefined, this.tmpFeatures)
      : 'addfeature';
  }

  cancel(): void {
    this.hsDrawService.selectedLayer = this.hsDrawService.previouslySelected;
    this.hsDialogContainerService.destroy(this);
  }

  pathChanged(): void {
    setPath(this.layer, this.path);
  }

  addAttr(): void {
    this.attributes.push({id: Math.random(), name: '', value: ''});
  }

  selectLayer(layer): void {
    this.hsDrawService.selectLayer(layer);
    this.hsDialogContainerService.destroy(this);
  }
}
