import {Injectable} from '@angular/core';

import {Layer} from 'ol/layer';
import {Source} from 'ol/source';

import {HsDialogContainerService} from '../../components/layout/dialogs/dialog-container.service';
import {
  HsDrawService,
  TMP_LAYER_TITLE,
} from '../../components/draw/draw.service';
import {HsLanguageService} from '../../components/language/language.service';
import {HsLaymanService} from '../../components/save-map/layman.service';
import {HsMapService} from '../../components/map/map.service';
import {
  HsRmLayerDialogComponent,
  HsRmLayerDialogResponse,
} from './remove-layer-dialog.component';
import {HsToastService} from '../../components/layout/toast/toast.service';
import {getDefinition, getTitle} from '../layer-extensions';

@Injectable({
  providedIn: 'root',
})
export class HsRemoveLayerDialogService {
  constructor(
    private hsMapService: HsMapService,
    private hsToastService: HsToastService,
    private hsLanguageService: HsLanguageService,
    private hsDrawService: HsDrawService,
    private hsLaymanService: HsLaymanService,
    private hsDialogContainerService: HsDialogContainerService,
  ) {}

  /**
   * Removes selected drawing layer from both Layermanager and Layman
   */
  async removeLayer(): Promise<void> {
    const dialog = this.hsDialogContainerService.create(
      HsRmLayerDialogComponent,
      {
        multiple: false,
        message: this.translate('DRAW.reallyDeleteThisLayer'),
        note: this.getDeleteNote(),
        title: this.translate('COMMON.confirmDelete'),
      },
    );
    const confirmed: HsRmLayerDialogResponse = await dialog.waitResult();
    if (confirmed.value == 'yes') {
      const fromMapOnly = confirmed.type === 'map';
      await this.completeLayerRemoval(
        this.hsDrawService.selectedLayer,
        fromMapOnly,
      );
      this.hsDrawService.selectedLayer = null;
      this.hsDrawService.fillDrawableLayers();
    }
  }

  /**
   * Removes multiple selected layers from both Layermanager and Layman
   */
  async removeMultipleLayers(items?: Layer<Source>[]): Promise<void> {
    items ??= [
      ...(this.hsDrawService.drawableLayers ?? []),
      ...(this.hsDrawService.drawableLaymanLayers ?? []),
    ];
    const dialog = this.hsDialogContainerService.create(
      HsRmLayerDialogComponent,
      {
        multiple: true,
        message: this.translate('DRAW.pleaseCheckTheLayers'),
        note: this.getDeleteNote(true),
        title: this.translate('COMMON.selectAndConfirmToDeleteMultiple'),
        items: items,
      },
    );
    const confirmed: HsRmLayerDialogResponse = await dialog.waitResult();
    if (confirmed.value == 'yes') {
      this.hsToastService.createToastPopupMessage(
        this.translate('LAYMAN.deleteLayersRequest'),
        this.translate('LAYMAN.deletionInProgress'),
        {
          toastStyleClasses: 'bg-info text-white',
          serviceCalledFrom: 'HsDrawService',
          disableLocalization: true,
          customDelay: 600000,
        },
      );
      const drawableLaymanRm = this.hsDrawService.drawableLaymanLayers.filter(
        (l) => l.toRemove,
      );

      const drawableRm = (
        items as (Layer<Source> & {toRemove: boolean})[]
      ).filter((l) => l.toRemove);

      const fromMapOnly = confirmed.type === 'map';
      if (
        drawableLaymanRm?.length ==
          this.hsDrawService.drawableLaymanLayers?.length &&
        this.hsDrawService.drawableLaymanLayers?.length != 0 &&
        !fromMapOnly
      ) {
        await this.hsLaymanService.removeLayer();
        for (const l of drawableRm) {
          await this.completeLayerRemoval(l, fromMapOnly);
        }
      } else {
        const toRemove = [...drawableRm, ...drawableLaymanRm];
        for (const l of toRemove) {
          await this.completeLayerRemoval(l, fromMapOnly);
        }
      }
      this.hsToastService.removeByText(
        this.hsLanguageService.getTranslation(
          'LAYMAN.deletionInProgress',
          undefined,
        ),
      );
      this.hsDrawService.selectedLayer = null;
      this.hsDrawService.fillDrawableLayers();
    }
  }

  private async completeLayerRemoval(
    layerToRemove: any,
    fromMapOnly: boolean,
  ): Promise<void> {
    let definition;
    const isLayer = layerToRemove instanceof Layer;
    if (isLayer) {
      this.hsMapService.getMap().removeLayer(layerToRemove);
      definition = getDefinition(layerToRemove);
      if (getTitle(layerToRemove) == TMP_LAYER_TITLE) {
        this.hsDrawService.tmpDrawLayer = false;
      }
    }
    if (
      (definition?.format?.toLowerCase().includes('wfs') &&
        definition?.url &&
        !fromMapOnly) ||
      !isLayer
    ) {
      await this.hsLaymanService.removeLayer(layerToRemove.name);
    }
  }

  /**
   * Syntactic sugar for translating
   */
  translate(key: string, params?: any): string {
    return this.hsLanguageService.getTranslation(key, params);
  }

  getDeleteNote(plural?: boolean): string {
    return this.hsDrawService.isAuthenticated
      ? this.translate(plural ? 'DRAW.deleteNotePlural' : 'DRAW.deleteNote')
      : '';
  }
}
