import ImageLayer from 'ol/layer/Image';
import {CommonModule, NgFor} from '@angular/common';
import {Component} from '@angular/core';
import {HsConfirmDialogComponent} from '../../../../common/confirm/confirm-dialog.component';
import {HsConfirmModule} from '../../../../common/confirm/confirm.module';
import {HsDialogContainerService} from '../../../layout/dialogs/dialog-container.service';
import {HsLanguageModule} from '../../../language/language.module';
import {HsLanguageService} from '../../../language/language.service';
import {HsLayerEditorWidgetBaseComponent} from '../layer-editor-widget-base.component';
import {HsLayerSelectorService} from '../../editor/layer-selector.service';
import {HsLayerShiftingService} from '../../../../common/layer-shifting/layer-shifting.service';
import {HsLayerUtilsService} from '../../../utils/layer-utils.service';
import {HsMapService} from '../../../map/map.service';
import {HsUtilsService} from '../../../utils/utils.service';
import {Image, Tile} from 'ol/layer';
import {ImageWMS, TileWMS} from 'ol/source';
import {Observable, map, tap} from 'rxjs';

@Component({
  selector: 'hs-wms-source-widget',
  standalone: true,
  imports: [CommonModule, NgFor, HsConfirmModule, HsLanguageModule],
  templateUrl: './wms-source-widget.component.html',
  styleUrl: './wms-source-widget.component.css',
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
    private hsLanguageService: HsLanguageService,
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
        message: this.hsLanguageService.getTranslation(
          'LAYERMANAGER.layerEditor.changeLayerType',
          undefined,
        ),
        note: this.hsLanguageService.getTranslation(
          'LAYERMANAGER.layerEditor.layerTypeChangeNote',
          undefined,
        ),
        title: this.hsLanguageService.getTranslation(
          'LAYERMANAGER.layerEditor.confirmLayerTypeChange',
          undefined,
        ),
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
      this.currentType == 'Tile' ? new Image(layerProps) : new Tile(layerProps);

    this.hsMapService.getMap().addLayer(lyr);
    this.hsLayerShiftingService.moveTo(lyr, this.olLayer.getZIndex());
    this.hsMapService.getMap().removeLayer(this.olLayer);
  }
}
