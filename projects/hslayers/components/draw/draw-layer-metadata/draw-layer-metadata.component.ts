import {Component, Input, OnInit, ViewRef} from '@angular/core';

import {AccessRightsModel} from 'hslayers-ng/types';
import {HsDialogComponent} from 'hslayers-ng/common/dialogs';
import {HsDialogContainerService} from 'hslayers-ng/common/dialogs';
import {HsDrawService} from 'hslayers-ng/shared/draw';
import {HsMapService} from 'hslayers-ng/shared/map';
import {
  awaitLayerSync,
  getLaymanFriendlyLayerName,
} from 'hslayers-ng/common/layman';
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
  templateUrl: './draw-layer-metadata.html',
})
export class HsDrawLayerMetadataDialogComponent
  implements HsDialogComponent, OnInit {
  @Input() data: {
    service: HsDrawService;
  };

  newLayerPath: string;
  attributes: Array<any> = [];
  layer: any;
  title: any;
  path: string;
  folderVisible = false;
  type: string;
  endpoint: any;
  access_rights: AccessRightsModel = {
    'access_rights.write': 'private',
    'access_rights.read': 'EVERYONE',
  };
  onlyMineFilterVisible = false;
  tmpFeatures: any;
  constructor(
    public HsMapService: HsMapService,
    public HsDialogContainerService: HsDialogContainerService,
  ) {}

  viewRef: ViewRef;
  ngOnInit(): void {
    this.layer = this.data.service.selectedLayer;
    this.title = getTitle(this.layer);
    this.path = getPath(this.layer);
    this.endpoint = this.data.service.laymanEndpoint;
    this.type = 'draw';
  }

  titleChanged(): void {
    setTitle(this.layer, this.title);
  }

  confirm(): void {
    const dic = {};

    setName(this.layer, getLaymanFriendlyLayerName(getTitle(this.layer)));
    const tmpLayer = this.HsMapService.findLayerByTitle('tmpDrawLayer') || null;
    if (tmpLayer) {
      this.HsMapService.getMap().removeLayer(tmpLayer);
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
    this.data.service.changeDrawSource();

    this.data.service.addDrawLayer(this.layer);
    this.data.service.fillDrawableLayers();
    this.tmpFeatures = this.layer.getSource().getFeatures();
    //Dispatch add feature event in order to trigger sync
    awaitLayerSync(this.layer).then(() => {
      const event = this.tmpFeatures ? this.getEventType() : 'addfeature';
      this.layer.getSource().dispatchEvent(event);
    });
    this.data.service.tmpDrawLayer = false;
    this.HsDialogContainerService.destroy(this);
  }

  getEventType() {
    return this.layer.getSource().getFeatures().length > this.tmpFeatures.length
      ? //Existing layer
        {type: 'addfeature', feature: this.tmpFeatures}
      : //New layer
        'addfeature';
  }

  cancel(): void {
    this.data.service.selectedLayer = this.data.service.previouslySelected;
    this.HsDialogContainerService.destroy(this);
  }

  pathChanged(): void {
    setPath(this.layer, this.path);
  }

  addAttr(): void {
    this.attributes.push({id: Math.random(), name: '', value: ''});
  }

  selectLayer(layer): void {
    this.data.service.selectLayer(layer);
    this.HsDialogContainerService.destroy(this);
  }
}
