import {Injectable} from '@angular/core';

import {Layer} from 'ol/layer';
import {Source} from 'ol/source';

import {HsDialogContainerService} from 'hslayers-ng/common/dialogs';
import {HsDrawService, TMP_LAYER_TITLE} from 'hslayers-ng/shared/draw';
import {HsLanguageService} from 'hslayers-ng/shared/language';
import {HsLaymanService} from 'hslayers-ng/shared/save-map';
import {HsMapService} from 'hslayers-ng/shared/map';
import {
  HsRmLayerDialogComponent,
  HsRmLayerDialogResponse,
} from './remove-layer-dialog.component';
import {HsToastService} from 'hslayers-ng/common/toast';
import {getDefinition, getTitle} from 'hslayers-ng/common/extensions';

export type RemoveLayerWrapper = {
  layer: Layer<Source>;
  toRemove: boolean;
  displayTitle: string;
};

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
   * Create a remove layer wrapper
   */
  wrapLayer(layer: Layer<Source>): RemoveLayerWrapper {
    return {
      layer,
      toRemove: false,
      displayTitle: undefined,
    };
  }

  /**
   * Removes selected drawing layer from both Layermanager and Layman
   * @param layer Layer to be deleted - use when trying to delete layer other than hsDrawService.selectedLayer
   */
  async removeLayer(layer?: Layer<Source>): Promise<void> {
    const dialog = this.hsDialogContainerService.create(
      HsRmLayerDialogComponent,
      {
        multiple: false,
        message: 'DRAW.reallyDeleteThisLayer',
        note: this.getDeleteNote(),
        title: 'COMMON.confirmDelete',
        items: layer
          ? [this.wrapLayer(layer)]
          : [this.wrapLayer(this.hsDrawService.selectedLayer)],
      },
    );
    const confirmed: HsRmLayerDialogResponse = await dialog.waitResult();
    if (confirmed.value == 'yes') {
      const fromMapOnly = confirmed.type === 'map';
      await this.completeLayerRemoval(
        layer ?? this.hsDrawService.selectedLayer,
        fromMapOnly,
      );
      this.hsDrawService.selectedLayer = null;
      this.hsDrawService.fillDrawableLayers();
    }
  }

  /**
   * Removes multiple selected layers from both Layermanager and Layman
   */
  async removeMultipleLayers(layers?: Layer<Source>[]): Promise<void> {
    const layersToRemove = layers ?? this.hsDrawService.drawableLayers ?? [];
    const items = layersToRemove.map((l) => this.wrapLayer(l));

    const dialog = this.hsDialogContainerService.create(
      HsRmLayerDialogComponent,
      {
        multiple: true,
        message: 'DRAW.pleaseCheckTheLayers',
        note: this.getDeleteNote(true),
        title: 'COMMON.selectAndConfirmToDeleteMultiple',
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

      const drawablesToRemove = items.filter((l) => l.toRemove);

      const fromMapOnly = confirmed.type === 'map';
      /**
       * Remove checked layers, may be either - from layman and/or map
       */
      //}
      for (const l of drawablesToRemove) {
        await this.completeLayerRemoval(l.layer, fromMapOnly);
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

  /**
   * Remove layer from map and layman if desirable and possible
   */
  private async completeLayerRemoval(
    layerToRemove: Layer<Source>,
    fromMapOnly: boolean,
  ): Promise<void> {
    const definition = getDefinition(layerToRemove);
    if (
      definition?.format?.toLowerCase().includes('wfs') &&
      definition?.url &&
      !fromMapOnly
    ) {
      await this.hsLaymanService.removeLayer(layerToRemove);
    }
    if (getTitle(layerToRemove) == TMP_LAYER_TITLE) {
      this.hsDrawService.tmpDrawLayer = false;
    }

    this.hsMapService.getMap().removeLayer(layerToRemove);
  }

  /**
   * Syntactic sugar for translating
   */
  translate(key: string, params?: any): string {
    return this.hsLanguageService.getTranslation(key, params);
  }

  getDeleteNote(plural?: boolean): string {
    return this.hsDrawService.isAuthenticated
      ? plural
        ? 'DRAW.deleteNotePlural'
        : 'DRAW.deleteNote'
      : '';
  }
}
