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

class HsFeatureCommonServiceParams {
  listSubject = new BehaviorSubject<Layer<Source>[]>([] as Layer<Source>[]);

  availableLayer$: Observable<Layer<Source>[]> =
    this.listSubject.asObservable();
}

@Injectable({
  providedIn: 'root',
})
export class HsFeatureCommonService {
  apps: {
    [id: string]: HsFeatureCommonServiceParams;
  } = {default: new HsFeatureCommonServiceParams()};

  constructor(
    public hsQueryVectorService: HsQueryVectorService,
    public hsToastService: HsToastService,
    public hsLanguageService: HsLanguageService,
    public hsMapService: HsMapService,
    public hsLayerUtilsService: HsLayerUtilsService
  ) {}

  async init(app: string): Promise<void> {
    if (this.apps[app]) {
      return;
    }
    await this.hsMapService.loaded(app);
    this.hsMapService
      .getMap(app)
      .getLayers()
      .on('change:length', () => {
        this.updateLayerList(app);
      });
    this.apps[app] = new HsFeatureCommonServiceParams();
  }

  translateString(module: string, text: string, app: string): string {
    return this.hsLanguageService.getTranslationIgnoreNonExisting(
      module,
      text,
      undefined,
      app
    );
  }

  updateLayerList(app: string): void {
    const layers = this.hsMapService
      .getLayersArray(app)
      .filter((layer: Layer<Source>) => {
        return this.hsLayerUtilsService.isLayerDrawable(layer);
      });
    this.apps[app].listSubject.next(layers);
  }

  toggleExportMenu(
    exportFormats,
    features: Feature<Geometry>[] | Feature<Geometry>,
    app: string
  ): void {
    for (const format of exportFormats) {
      format.serializedData = this.hsQueryVectorService.exportData(
        format.name,
        features,
        app
      );
    }
  }

  moveOrCopyFeature(
    type: string,
    features: Feature<Geometry>[],
    toLayer: Layer<VectorSource<Geometry>>,
    app: string
  ): void {
    features.forEach((feature) => {
      feature.setStyle(null); //To prevent feature from getting individual style
      toLayer.getSource().addFeature(feature.clone());
      if (type == 'move') {
        this.hsQueryVectorService.removeFeature(feature, app);
      }
    });

    this.hsToastService.createToastPopupMessage(
      this.hsLanguageService.getTranslation('QUERY.feature.featureEdited'),
      this.hsLanguageService.getTranslation(
        `QUERY.feature.feature${type}Succ`,
        undefined,
        app
      ) + getTitle(toLayer),
      {
        toastStyleClasses: 'bg-success text-light',
        serviceCalledFrom: 'HsFeatureCommonService',
      },
      app
    );
  }
}
