import {Component, Input, OnInit, ViewRef} from '@angular/core';

import {HsDialogComponent} from '../../layout/dialogs/dialog-component.interface';
import {HsDialogContainerService} from '../../layout/dialogs/dialog-container.service';
import {HsDrawService} from '../draw.service';
import {HsMapService} from '../../map/map.service';
import {accessRightsModel} from '../../add-data/common/access-rights.model';
import {
  awaitLayerSync,
  getLaymanFriendlyLayerName,
} from '../../save-map/layman-utils';
import {
  getEditor,
  getPath,
  getTitle,
  setAccessRights,
  setEditor,
  setName,
  setPath,
  setTitle,
} from '../../../common/layer-extensions';

@Component({
  selector: 'hs-draw-layer-metadata',
  templateUrl: './draw-layer-metadata.html',
})
export class HsDrawLayerMetadataDialogComponent
  implements HsDialogComponent, OnInit {
  @Input() data: {
    service: HsDrawService;
    app: string;
  };

  newLayerPath: string;
  attributes: Array<any> = [];
  layer: any;
  title: any;
  path: string;
  folderVisible = false;
  type: string;
  endpoint: any;
  access_rights: accessRightsModel = {
    'access_rights.write': 'private',
    'access_rights.read': 'EVERYONE',
  };
  onlyMineFilterVisible = false;
  tmpFeatures: any;
  appRef;
  constructor(
    public HsMapService: HsMapService,
    public HsDialogContainerService: HsDialogContainerService
  ) {}

  viewRef: ViewRef;
  ngOnInit(): void {
    this.appRef = this.data.service.get(this.data.app);
    this.layer = this.appRef.selectedLayer;
    this.title = getTitle(this.layer);
    this.path = getPath(this.layer);
    this.endpoint = this.appRef.laymanEndpoint;
    this.type = 'draw';
  }

  titleChanged(): void {
    setTitle(this.layer, this.title);
  }

  confirm(): void {
    const dic = {};

    setName(this.layer, getLaymanFriendlyLayerName(getTitle(this.layer)));
    const tmpLayer =
      this.HsMapService.findLayerByTitle('tmpDrawLayer', this.data.app) || null;
    if (tmpLayer) {
      this.HsMapService.getMap(this.data.app).removeLayer(tmpLayer);
    }

    this.attributes.forEach((a) => {
      dic[a.name] = a.value;
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
    const appService = this.data.service;
    appService.changeDrawSource(this.data.app);

    appService.addDrawLayer(this.layer, this.data.app);
    appService.fillDrawableLayers(this.data.app);
    this.tmpFeatures = this.layer.getSource().getFeatures();
    //Dispatch add feature event in order to trigger sync
    awaitLayerSync(this.layer).then(() => {
      const event = this.tmpFeatures ? this.getEventType() : 'addfeature';
      this.layer.getSource().dispatchEvent(event);
    });
    this.appRef.tmpDrawLayer = false;
    this.HsDialogContainerService.destroy(this, this.data.app);
  }

  getEventType() {
    return this.layer.getSource().getFeatures().length > this.tmpFeatures.length
      ? //Existing layer
        {type: 'addfeature', feature: this.tmpFeatures}
      : //New layer
        'addfeature';
  }

  cancel(): void {
    this.appRef.selectedLayer = this.appRef.previouslySelected;
    this.HsDialogContainerService.destroy(this, this.data.app);
  }

  pathChanged(): void {
    setPath(this.layer, this.path);
  }

  addAttr(): void {
    this.attributes.push({id: Math.random(), name: '', value: ''});
  }

  selectLayer(layer): void {
    this.data.service.selectLayer(layer, this.data.app);
    this.HsDialogContainerService.destroy(this, this.data.app);
  }
}
