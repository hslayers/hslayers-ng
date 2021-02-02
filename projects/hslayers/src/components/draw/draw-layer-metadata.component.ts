import {Component, Input, ViewRef} from '@angular/core';
import {HsDialogComponent} from '../layout/dialogs/dialog-component.interface';
import {HsDialogContainerService} from '../../components/layout/dialogs/dialog-container.service';
import {HsMapService} from '../map/map.service';
import {
  getEditor,
  getTitle,
  setEditor,
  setTitle,
} from '../../common/layer-extensions';

@Component({
  selector: 'hs-draw-layer-metadata',
  templateUrl: './partials/draw-layer-metadata.html',
})
export class HsDrawLayerMetadataDialogComponent implements HsDialogComponent {
  @Input() data: any;

  AddNewDrawLayerModalVisible = true;
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
    this.path = this.layer.get('path');
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
    this.AddNewDrawLayerModalVisible = false;
    this.data.tmpDrawLayer = false;

    this.awaitLayerSync(this.layer).then(() => {
      this.layer.getSource().dispatchEvent('addfeature');
    });
  }

  cancel() {
    this.data.selectedLayer = this.data.previouslySelected;
    this.AddNewDrawLayerModalVisible = false;
    this.HsDialogContainerService.destroy(this);
  }

  async awaitLayerSync(layer) {
    while (layer.get('hs-layman-synchronizing')) {
      await new Promise((r) => setTimeout(r, 200));
    }
    return true;
  }

  pathChanged(): void {
    this.layer.set('path', this.path);
  }

  addAttr(): void {
    this.attributes.push({id: Math.random(), name: '', value: ''});
  }

  selectLayer(layer) {
    this.data.selectLayer(layer);
    this.AddNewDrawLayerModalVisible = false;
  }
}
