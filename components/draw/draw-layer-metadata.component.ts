import {Component, Input} from '@angular/core';
import {Injector} from '@angular/core';

import {HsDialogComponent} from '../layout/dialog-component.interface';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLayerManagerService} from '../layermanager/layermanager.service';
import {HsMapService} from '../map/map.service';

@Component({
  selector: 'hs-draw-layer-metadata',
  template: require('./draw-layer-metadata.html'),
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
  ngOnInit() {
    this.layer = this.data.selectedLayer;
    this.title = this.layer.get('title');
    this.path = this.layer.get('path');
  }
  titleChanged() {
    this.layer.set('title', this.title);
  }

  confirm() {
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

  pathChanged() {
    this.layer.set('path', this.path);
  }

  addAttr() {
    this.attributes.push({id: Math.random(), name: '', value: ''});
  }
}