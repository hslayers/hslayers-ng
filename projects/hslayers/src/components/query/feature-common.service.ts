import {Injectable} from '@angular/core';

import VectorSource from 'ol/source/Vector';
import {BehaviorSubject, Observable} from 'rxjs';
import {Feature} from 'ol';
import {Geometry} from 'ol/geom';
import {Layer} from 'ol/layer';
import {Source} from 'ol/source';

import {HsLanguageService} from '../language/language.service';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsMapService} from '../map/map.service';
import {HsQueryVectorService} from './query-vector.service';
import {HsToastService} from '../layout/toast/toast.service';

import {getTitle} from '../../common/layer-extensions';

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
  private listSubject = new BehaviorSubject<Layer<Source>[]>(
    [] as Layer<Source>[]
  );

  availableLayer$: Observable<Layer<Source>[]> =
    this.listSubject.asObservable();

  constructor(
    public hsQueryVectorService: HsQueryVectorService,
    public hsToastService: HsToastService,
    public hsLanguageService: HsLanguageService,
    public hsMapService: HsMapService,
    public hsLayerUtilsService: HsLayerUtilsService
  ) {
    this.hsMapService.loaded().then((map) => {
      map.getLayers().on('change:length', () => {
        this.updateLayerList();
      });
    });
  }

  translateString(module: string, text: string): string {
    return this.hsLanguageService.getTranslationIgnoreNonExisting(module, text);
  }

  updateLayerList(): void {
    const layers = this.hsMapService
      .getLayersArray()
      .filter((layer: Layer<Source>) => {
        return this.hsLayerUtilsService.isLayerDrawable(layer);
      });
    this.listSubject.next(layers);
  }

  toggleExportMenu(
    exportFormats,
    features: Feature<Geometry>[] | Feature<Geometry>
  ): void {
    for (const format of exportFormats) {
      format.serializedData = this.hsQueryVectorService.exportData(
        format.name,
        features
      );
    }
  }

  moveOrCopyFeature(
    type: string,
    features: Feature<Geometry>[],
    toLayer: Layer<VectorSource<Geometry>>
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
        `QUERY.feature.feature${type}Succ`
      ) + getTitle(toLayer),
      {
        toastStyleClasses: 'bg-success text-light',
        serviceCalledFrom: 'HsFeatureCommonService',
      }
    );
  }
}
