import {Component} from '@angular/core';

import {HsConfig} from '../../../config.service';
import {HsDrawService} from '../draw.service';
import {HsLanguageService} from '../../language/language.service';
import {HsLayerUtilsService} from '../../utils/layer-utils.service';
import {HsLayoutService} from '../../layout/layout.service';
import {HsToolbarPanelBaseComponent} from '../../toolbar/toolbar-panel-base.component';
import {getTitle} from '../../../common/layer-extensions';

@Component({
  selector: 'hs-draw-toolbar',
  templateUrl: './draw-toolbar.html',
})
export class HsDrawToolbarComponent extends HsToolbarPanelBaseComponent {
  drawToolbarExpanded = false;
  onlyMineFilterVisible = false;
  name = 'drawToolbar';
  getTitle = getTitle;
  appRef;
  sidebarPosition: string;
  constructor(
    public HsDrawService: HsDrawService,
    public HsLayoutService: HsLayoutService,
    public HsLayerUtilsService: HsLayerUtilsService, //Used in template
    public HsConfig: HsConfig,
    public HsLanguageService: HsLanguageService
  ) {
    super(HsLayoutService);
  }
  ngOnInit() {
    this.appRef = this.HsDrawService.get(this.data.app);
    this.HsLayoutService.sidebarPosition.subscribe(({app, position}) => {
      if (this.data.app == app) {
        this.sidebarPosition = position;
      }
    });
  }

  selectionMenuToggled(): void {
    this.setType(this.appRef.type);
  }

  translateString(module: string, text: string): string {
    return this.HsLanguageService.getTranslationIgnoreNonExisting(module, text);
  }

  toggleDrawToolbar(app: string): void {
    this.appRef.highlightDrawButton = false;
    if (
      this.HsLayoutService.get(app).layoutElement.clientWidth > 767 &&
      this.HsLayoutService.get(app).layoutElement.clientWidth < 870 &&
      !this.drawToolbarExpanded
    ) {
      this.HsLayoutService.get(app).sidebarExpanded = false;
    }
    this.drawToolbarExpanded = !this.drawToolbarExpanded;
    if (!this.drawToolbarExpanded) {
      this.HsDrawService.stopDrawing(this.data.app);
    }
    this.HsDrawService.fillDrawableLayers(this.data.app);
  }
  selectLayer(layer): void {
    this.HsDrawService.selectLayer(layer, this.data.app);
  }

  controlLayerListAction() {
    if (!this.appRef.hasSomeDrawables && this.appRef.tmpDrawLayer) {
      this.HsDrawService.saveDrawingLayer(this.data.app);
    }
  }

  setType(what): void {
    const type = this.HsDrawService.setType(what, this.data.app);
    if (type) {
      this.HsDrawService.activateDrawing({}, this.data.app);
    }
  }

  finishDrawing(): void {
    this.HsDrawService.stopDrawing(this.data.app);
  }
}
