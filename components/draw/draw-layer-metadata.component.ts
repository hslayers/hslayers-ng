import {Component, Input} from '@angular/core';
import {HsDialogComponent} from '../layout/dialog-component.interface';
import {HsMapService} from '../map/map.service';

@Component({
  selector: 'hs-draw-layer-metadata',
  template: require('./partials/draw-layer-metadata.html'),
})
export class HsDrawLayerMetadataDialogComponent implements HsDialogComponent {
  @Input() data: any;

  AddNewDrawLayerModalVisible = true;
  newLayerPath: string;
  attributes: Array<any> = [];
  layer: any;
  title: any;
  path: string;

  constructor(private HsMapService: HsMapService) {}

  ngOnInit(): void {
    this.layer = this.data.selectedLayer;
    this.title = this.layer.get('title');
    this.path = this.layer.get('path');
  }

  titleChanged(): void {
    this.layer.set('title', this.title);
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
    let editorConfig = this.layer.get('editor');
    if (!editorConfig) {
      editorConfig = {};
      this.layer.set('editor', editorConfig);
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
  }

  pathChanged(): void {
    this.layer.set('path', this.path);
  }

  addAttr(): void {
    this.attributes.push({id: Math.random(), name: '', value: ''});
  }
}
