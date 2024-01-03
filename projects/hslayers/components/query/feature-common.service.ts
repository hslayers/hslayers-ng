import {BehaviorSubject, Observable} from 'rxjs';
import {Injectable} from '@angular/core';

import {Feature} from 'ol';
import {Geometry} from 'ol/geom';
import {Layer} from 'ol/layer';
import {Source, Vector as VectorSource} from 'ol/source';

import {HsLanguageService} from 'hslayers-ng/components/language';
import {HsLayerUtilsService} from 'hslayers-ng/shared/utils';
import {HsMapService} from 'hslayers-ng/components/map';
import {HsQueryVectorService} from './query-vector.service';
import {HsToastService} from 'hslayers-ng/components/layout';
import {getTitle} from 'hslayers-ng/common/extensions';

export interface exportFormats {
  name: 'WKT' | 'GeoJSON';
  ext: string; //File extension
  serializedData?: string; //Features as string according to WKT or GeoJSON
  mimeType: string;
  downloadData?: any; //Serialized/sanitized data suitable for href
}
[];

@Injectable({
  providedIn: 'root',
})
export class HsFeatureCommonService {
  listSubject = new BehaviorSubject<Layer<Source>[]>([] as Layer<Source>[]);

  availableLayer$: Observable<Layer<Source>[]> =
    this.listSubject.asObservable();

  constructor(
    private hsQueryVectorService: HsQueryVectorService,
    private hsToastService: HsToastService,
    private hsLanguageService: HsLanguageService,
    private hsMapService: HsMapService,
    private hsLayerUtilsService: HsLayerUtilsService,
  ) {
    this.hsMapService.loaded().then((map) => {
      map.getLayers().on('change:length', () => {
        this.updateLayerList();
      });
    });
  }

  /**
   * Translate string value to the selected UI language
   * @param module - Locales json key
   * @param text - Locales json key value
   * @returns Translated text
   */
  translateString(module: string, text: string): string {
    return this.hsLanguageService.getTranslationIgnoreNonExisting(
      module,
      text,
      undefined,
    );
  }

  /**
   * Update layer list from the current app map
   */
  updateLayerList(): void {
    const layers = this.hsMapService
      .getLayersArray()
      .filter((layer: Layer<Source>) => {
        return this.hsLayerUtilsService.isLayerDrawable(layer);
      });
    this.listSubject.next(layers);
  }

  /**
   * Prepare features for export
   * @param exportFormats - Export formats selected
   * @param features - Features to export
   */
  toggleExportMenu(
    exportFormats: exportFormats[],
    features: Feature<Geometry>[] | Feature<Geometry>,
  ): void {
    for (const format of exportFormats) {
      format.serializedData = this.hsQueryVectorService.exportData(
        format.name,
        features,
      );
    }
  }

  /**
   * Move or copy feature/s
   * @param type - Action type ('move' or 'copy')
   * @param features - Features to interact with
   * @param toLayer - Target layer
   */
  moveOrCopyFeature(
    type: 'move' | 'copy',
    features: Feature<Geometry>[],
    toLayer: Layer<VectorSource>,
  ): void {
    features.forEach((feature) => {
      feature.setStyle(null); //To prevent feature from getting individual style
      toLayer.getSource().addFeature(feature.clone());
      if (type == 'move') {
        this.hsQueryVectorService.removeFeature(feature);
      }
    });
    this.hsToastService.createToastPopupMessage(
      this.hsLanguageService.getTranslation('QUERY.feature.featureEdited'),
      this.hsLanguageService.getTranslation(
        `QUERY.feature.feature${type}Succ`,
        undefined,
      ) + getTitle(toLayer),
      {
        toastStyleClasses: 'bg-success text-light',
        serviceCalledFrom: 'HsFeatureCommonService',
      },
    );
  }
}
