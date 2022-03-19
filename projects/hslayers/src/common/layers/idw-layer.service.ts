import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {transform} from 'ol/proj';

import IDW from 'ol-ext/source/IDW';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import {Feature} from 'ol';
import {Fill, Stroke, Style, Text} from 'ol/style';
import {GeoJSON} from 'ol/format';
import {Geometry} from 'ol/geom';
import {Image as ImageLayer, Layer} from 'ol/layer';
import {Source} from 'ol/source';
import {Subject, catchError, takeUntil} from 'rxjs';

import {HsConfig} from '../../config.service';
import {HsLanguageService} from '../../components/language/language.service';
import {HsToastService} from './../../components/layout/toast/toast.service';
import {HsUtilsService} from '../../components/utils/utils.service';
import {parseExtent} from '../extent-utils';

class IDWLayerServiceParams {
  cachedIDWFeatures?: Feature<Geometry>[] = [];
  cancelUrlRequest?: Subject<void> = new Subject();
}
@Injectable({
  providedIn: 'root',
})
export class HsIDWLayerService {
  apps: {
    [id: string]: IDWLayerServiceParams;
  } = {
    default: new IDWLayerServiceParams(),
  };

  constructor(
    private hsConfig: HsConfig,
    private hsUtilsService: HsUtilsService,
    private hsToastService: HsToastService,
    private hsLanguageService: HsLanguageService,
    private httpClient: HttpClient
  ) {}

  init(app: string): void {
    this.get(app).cancelUrlRequest.subscribe(() => {
      this.removeLoadingToast(app);
    });
  }

  /**
   * Get the params saved by the IDW Layer service for the current app
   * @param app - App identifier
   */
  get(app: string): IDWLayerServiceParams {
    if (this.apps[app ?? 'default'] == undefined) {
      this.apps[app ?? 'default'] = new IDWLayerServiceParams();
    }
    return this.apps[app ?? 'default'];
  }

  async getIDWSource(
    mapProjection: string,
    app: string,
    extent?: number[]
  ): Promise<any> {
    return new Promise(async (resolve, reject) => {
      let features;
      const weight = this.hsConfig.get(app).interpolatedLayer?.weight ?? '';
      const url = this.createIDWSourceUrl(mapProjection, app, extent);
      const initialFeatures =
        this.hsConfig.get(app).interpolatedLayer?.initialFeatures ?? [];
      if (url) {
        this.hsToastService.createToastPopupMessage(
          await this.hsLanguageService.awaitTranslation(
            'IDW layer request',
            undefined,
            app
          ),
          'Loading IDW layer source, please wait!',
          {
            disableLocalization: true,
            toastStyleClasses: 'bg-warning text-light',
            serviceCalledFrom: 'HsIDWLayerService',
            customDelay: 60000,
          },
          app
        );
        this.httpClient
          .get(this.hsUtilsService.proxify(url, app))
          .pipe(
            takeUntil(this.get(app).cancelUrlRequest),
            catchError(async (e) => {
              this.removeLoadingToast(app);
              this.hsToastService.createToastPopupMessage(
                await this.hsLanguageService.awaitTranslation(
                  'IDW layer request',
                  undefined,
                  app
                ),
                'Failed to load IDW source',
                {
                  disableLocalization: true,
                  serviceCalledFrom: 'HsIDWLayerService',
                },
                app
              );
            })
          )
          .subscribe(async (response: any) => {
            this.removeLoadingToast(app);
            if (response?.features?.length > 0) {
              response.features = new GeoJSON().readFeatures(response, {
                dataProjection: 'EPSG:4326',
                featureProjection: mapProjection,
              });
              this.normalizeWeight(response.features, weight);
              this.get(app).cachedIDWFeatures = response.features;
              this.hsToastService.createToastPopupMessage(
                await this.hsLanguageService.awaitTranslation(
                  'IDW layer request',
                  undefined,
                  app
                ),
                'IDW source loaded',
                {
                  disableLocalization: true,
                  toastStyleClasses: 'bg-success text-light',
                  serviceCalledFrom: 'HsIDWLayerService',
                },
                app
              );
              features = [...response.features, ...initialFeatures];
              resolve(this.createIDWSource(features, weight));
            }
          });
      } else {
        resolve(this.createIDWSource(initialFeatures, weight));
      }
    });
  }

  createIDWSource(features: Feature<Geometry>[], weight: string) {
    return new IDW({
      // Source that contains the data
      source: new VectorSource({
        features,
      }),
      // Use val as weight property
      weight,
    });
  }

  createIDWLayer(idwSource, extent: number[], app: string): Layer<Source> {
    const title = this.hsConfig.get(app).interpolatedLayer?.title ?? 'IDW';
    return new ImageLayer({
      properties: {title, extent},
      source: idwSource,
      opacity: 0.5,
    });
  }

  createIDWSourceUrl(
    mapProjection: string,
    app: string,
    extent?: number[]
  ): string {
    const url = this.hsConfig.get(app).interpolatedLayer?.externalSourceUrl;
    if (!url) {
      return;
    } else if (extent) {
      const extentPairs = parseExtent(extent);
      const pair1 = transform(extentPairs[0], mapProjection, 'EPSG:4326');
      const pair2 = transform(extentPairs[1], mapProjection, 'EPSG:4326');
      extent = [...pair1, ...pair2];
      extent = extent.map((e) => Number(e.toFixed(1)));
    }
    return url;
  }
  createIDWVectorLayer(idwSource, app: string): Layer<Source> {
    const weight = this.hsConfig.get(app).interpolatedLayer?.weight ?? '';
    return new VectorLayer({
      properties: {
        title: 'IDW layer source',
      },
      source: idwSource.getSource(),
      style: function (feature, resolution) {
        return [
          new Style({
            text: new Text({
              text: feature?.get(weight)?.toString(),
              font: '12px Calibri,sans-serif',
              overflow: true,
              fill: new Fill({
                color: '#000',
              }),
              stroke: new Stroke({
                color: '#fff',
                width: 3,
              }),
            }),
          }),
        ];
      },
    });
  }

  removeLoadingToast(app: string): void {
    this.hsToastService.removeByText(
      this.hsLanguageService.getTranslation(
        'Loading IDW layer source, please wait!',
        undefined,
        app
      ),
      app
    );
  }

  normalizeWeight(features: Feature<Geometry>[], weight: string): void {
    //https://www.statology.org/normalize-data-between-0-and-100/
    const weightValues = features.map((f) => parseInt(f.get(weight)));
    const min = Math.min(...weightValues);
    const max = Math.max(...weightValues);
    features.forEach((f) => {
      const normalizedWeight = Math.ceil(
        ((f.get(weight) - min) / (max - min)) * 100
      );
      f.set(weight, normalizedWeight);
    });
  }
}
