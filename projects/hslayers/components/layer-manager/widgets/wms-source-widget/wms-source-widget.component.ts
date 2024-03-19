import {CommonModule, NgFor} from '@angular/common';
import {Component} from '@angular/core';
import {Observable, map, tap} from 'rxjs';

import {Image as ImageLayer, Tile} from 'ol/layer';
import {ImageWMS, TileWMS} from 'ol/source';

import {HsConfirmDialogComponent} from 'hslayers-ng/common/confirm';
import {HsDialogContainerService} from 'hslayers-ng/common/dialogs';
import {HsLayerEditorWidgetBaseComponent} from '../layer-editor-widget-base.component';
import {HsLayerSelectorService} from 'hslayers-ng/services/layer-manager';
import {HsLayerShiftingService} from 'hslayers-ng/services/layer-shifting';
import {HsLayerUtilsService} from 'hslayers-ng/services/utils';
import {HsMapService} from 'hslayers-ng/services/map';
import {HsUtilsService} from 'hslayers-ng/services/utils';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';

@Component({
  selector: 'hs-wms-source-widget',
  standalone: true,
  imports: [CommonModule, NgFor, HsConfirmDialogComponent, TranslateCustomPipe],
  templateUrl: './wms-source-widget.component.html',
})
export class HsWmsSourceWidgetComponent extends HsLayerEditorWidgetBaseComponent {
  name = 'wms-source-widget';
  isEnabled: Observable<boolean>;

  options = ['Tile', 'Image'];
  currentType: string;
  constructor(
    hsLayerSelectorService: HsLayerSelectorService,
    private hsLayerUtilsService: HsLayerUtilsService,
    private hsUtilsService: HsUtilsService,
    private hsMapService: HsMapService,
    private hsLayerShiftingService: HsLayerShiftingService,
    private hsDialogContainerService: HsDialogContainerService,
  ) {
    super(hsLayerSelectorService);
    this.isEnabled = this.layerDescriptor.pipe(
      tap((l) => {
        this.currentType = this.hsUtilsService.instOf(l.layer, ImageLayer)
          ? 'Image'
          : 'Tile';
      }),
      map((l) => {
        return this.hsLayerUtilsService.isLayerWMS(l.layer);
      }),
    );
  }

  private getUrls(source: TileWMS): string {
    return source.getUrls()[0];
  }

  private getUrl(source: ImageWMS): string[] {
    return [source.getUrl()];
  }

  async changeLayerType() {
    const dialog = this.hsDialogContainerService.create(
      HsConfirmDialogComponent,
      {
        message: 'LAYERMANAGER.layerEditor.changeLayerType',
        note: 'LAYERMANAGER.layerEditor.layerTypeChangeNote',
        title: 'LAYERMANAGER.layerEditor.confirmLayerTypeChange',
      },
    );
    const confirmed = await dialog.waitResult();
    if (confirmed === 'yes') {
      this.recreateLayer();
    }
  }

  /**
   * Clone layer properties and parameters and recreate it as a different type
   * (Tile or Image)
   */
  private recreateLayer() {
    const source = this.olLayer.getSource() as ImageWMS | TileWMS;
    const sourceOptions = {
      attributions: source.getAttributions(),
      projection: source.getProjection(),
      params: source.getParams(),
    };

    const urlTypeToGet = this.currentType == 'Tile' ? 'Urls' : 'Url';
    const urlTypeToSet = urlTypeToGet == 'Urls' ? 'url' : 'urls';

    sourceOptions[urlTypeToSet] = this[`get${urlTypeToGet}`](source as any);

    const layerProps = {...this.olLayer.getProperties()};
    layerProps.source =
      this.currentType == 'Tile'
        ? new ImageWMS(sourceOptions)
        : new TileWMS(sourceOptions);
    layerProps.map = undefined;
    const lyr =
      this.currentType == 'Tile'
        ? new ImageLayer(layerProps)
        : new Tile(layerProps);

    this.hsMapService.getMap().addLayer(lyr);
    this.hsLayerShiftingService.moveTo(lyr, this.olLayer.getZIndex());
    this.hsMapService.getMap().removeLayer(this.olLayer);
  }
}
