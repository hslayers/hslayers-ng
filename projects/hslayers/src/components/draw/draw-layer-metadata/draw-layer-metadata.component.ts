import {Component, Input, OnInit, ViewRef} from '@angular/core';
import {HsDialogComponent} from '../../layout/dialogs/dialog-component.interface';
import {HsDialogContainerService} from '../../layout/dialogs/dialog-container.service';
import {HsMapService} from '../../map/map.service';
import {accessRightsModel} from '../../add-data/common/access-rights.model';
import {
  getEditor,
  getHsLaymanSynchronizing,
  getPath,
  getTitle,
  setAccessRights,
  setEditor,
  setName,
  setPath,
  setTitle,
} from '../../../common/layer-extensions';
import {getLaymanFriendlyLayerName} from '../../save-map/layman-utils';

@Component({
  selector: 'hs-draw-layer-metadata',
  templateUrl: './draw-layer-metadata.html',
})
export class HsDrawLayerMetadataDialogComponent
  implements HsDialogComponent, OnInit
{
  @Input() data: any;

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

  constructor(
    public HsMapService: HsMapService,
    public HsDialogContainerService: HsDialogContainerService
  ) {}

  viewRef: ViewRef;
  ngOnInit(): void {
    this.layer = this.data.selectedLayer;
    this.title = getTitle(this.layer);
    this.path = getPath(this.layer);
    this.endpoint = this.data.laymanEndpoint;
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
      this.HsMapService.map.removeLayer(tmpLayer);
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
    this.data.changeDrawSource();

    this.data.addDrawLayer(this.layer);
    this.data.fillDrawableLayers();
    this.tmpFeatures = this.layer.getSource().getFeatures();
    //Dispatch add feature event in order to trigger sync
    this.awaitLayerSync(this.layer).then(() => {
      const event = this.tmpFeatures ? this.getEventType() : 'addfeature';
      this.layer.getSource().dispatchEvent(event);
    });
    this.data.tmpDrawLayer = false;
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
    this.data.selectedLayer = this.data.previouslySelected;
    this.HsDialogContainerService.destroy(this);
  }

  async awaitLayerSync(layer): Promise<any> {
    while (getHsLaymanSynchronizing(layer)) {
      await new Promise((r) => setTimeout(r, 200));
    }
    return true;
  }

  pathChanged(): void {
    setPath(this.layer, this.path);
  }

  addAttr(): void {
    this.attributes.push({id: Math.random(), name: '', value: ''});
  }

  selectLayer(layer): void {
    this.data.selectLayer(layer);
    this.HsDialogContainerService.destroy(this);
  }
}
