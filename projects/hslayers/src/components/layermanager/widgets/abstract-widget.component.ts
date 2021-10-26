import {Component} from '@angular/core';

import {HsLayerEditorWidgetBaseComponent} from './layer-editor-widget-base.component';
import {HsLayerManagerService} from '../layermanager.service';
import {HsLayerSelectorService} from '../editor/layer-selector.service';
import {getAbstract, setAbstract} from '../../../common/layer-extensions';

@Component({
  selector: 'hs-abstract-widget',
  templateUrl: './abstract-widget.component.html',
})
export class HsAbstractWidgetComponent extends HsLayerEditorWidgetBaseComponent {
  name = 'abstract-widget';

  constructor(
    hsLayerSelectorService: HsLayerSelectorService,
    public HsLayerManagerService: HsLayerManagerService
  ) {
    super(hsLayerSelectorService);
  }

  set abstract(newAbstract: string) {
    const layer = this.olLayer();
    if (layer == undefined) {
      return;
    }
    setAbstract(layer, newAbstract);
  }

  get abstract(): string {
    const layer = this.olLayer();
    if (layer == undefined) {
      return;
    }
    return getAbstract(layer);
  }
}
