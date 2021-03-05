import {Component, Input, OnInit, ViewRef} from '@angular/core';
import {HsDialogComponent} from '../layout/dialogs/dialog-component.interface';
import {HsDialogContainerService} from '../../components/layout/dialogs/dialog-container.service';
import {HsMapService} from '../map/map.service';
import {
  getEditor,
  getHsLaymanSynchronizing,
  getPath,
  getTitle,
  setEditor,
  setName,
  setPath,
  setTitle,
} from '../../common/layer-extensions';
import {getLaymanFriendlyLayerName} from '../save-map/layman-utils';

@Component({
  selector: 'hs-draw-layer-metadata',
  templateUrl: './partials/draw-layer-metadata.html',
})
export class HsDrawLayerMetadataDialogComponent
  implements HsDialogComponent, OnInit {
  @Input() data: any;

  newLayerPath: string;
  attributes: Array<any> = [];
  layer: any;
  title: any;
  path: string;
  folderVisible = false;
  type: string;
  endpoint: any;

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

    if (this.data.isAuthorized !== true) {
      this.type = 'draw';
    }
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

    this.data.changeDrawSource();

    this.data.addDrawLayer(this.layer);
    this.data.fillDrawableLayers();
    this.data.tmpDrawLayer = false;

    this.awaitLayerSync(this.layer).then(() => {
      this.layer.getSource().dispatchEvent('addfeature');
    });
    this.HsDialogContainerService.destroy(this);
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
  }
}
