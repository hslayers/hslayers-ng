import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

import IDW from 'ol-ext/source/IDW';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import {Fill, Stroke, Style, Text} from 'ol/style';
import {GeoJSON} from 'ol/format';
import {Image as ImageLayer, Layer} from 'ol/layer';
import {Source} from 'ol/source';
import {catchError, lastValueFrom} from 'rxjs';

import {HsConfig} from '../../config.service';
import {HsLanguageService} from '../../components/language/language.service';
import {HsToastService} from './../../components/layout/toast/toast.service';
import {HsUtilsService} from '../../components/utils/utils.service';

@Injectable({
  providedIn: 'root',
})
export class HsIDWLayerService {
  constructor(
    private hsConfig: HsConfig,
    private hsUtilsService: HsUtilsService,
    private hsToastService: HsToastService,
    private hsLanguageService: HsLanguageService,
    private httpClient: HttpClient
  ) {}
  async createIDWSource(mapProjection: string, app: string): Promise<any> {
    let features;
    const weight = this.hsConfig.get(app).interpolatedLayer?.weight ?? '';
    const url = this.hsConfig.get(app).interpolatedLayer?.externalSourceUrl;
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
        },
        app
      );
      const response = await lastValueFrom<any>(
        this.httpClient.get(this.hsUtilsService.proxify(url, app)).pipe(
          catchError(async (e) => {
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
      );
      if (response?.features?.length > 0) {
        response.features = new GeoJSON().readFeatures(response, {
          dataProjection: 'EPSG:4326',
          featureProjection: mapProjection,
        });
        response.features.forEach((f) =>
          f.set(weight, parseInt(f.get(weight)))
        );
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
      }
      features = [
        ...(response.features ?? []),
        ...(this.hsConfig.get(app).interpolatedLayer?.initialFeatures ?? []),
      ];
    } else {
      features =
        this.hsConfig.get(app).interpolatedLayer?.initialFeatures ?? [];
    }

    const idwLayerSource = new IDW({
      // Source that contains the data
      source: new VectorSource({
        features,
      }),
      // Use val as weight property
      weight,
    });
    return idwLayerSource;
  }
  createIDWLayer(idwSource, app: string): Layer<Source> {
    const title = this.hsConfig.get(app).interpolatedLayer?.title ?? 'IDW';
    return new ImageLayer({
      properties: {title},
      source: idwSource,
      opacity: 0.5,
    });
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
}
