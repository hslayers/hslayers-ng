import 'share-api-polyfill';

import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Layer} from 'ol/layer';
import {lastValueFrom} from 'rxjs';

import {HsConfig} from '../../config.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLanguageService} from '../language/language.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsLogService} from '../../common/log/log.service';
import {HsMapService} from '../map/map.service';
import {HsSaveMapService} from '../save-map/save-map.service';
import {HsShareThumbnailService} from './share-thumbnail.service';
import {HsShareUrlService} from './share-url.service';
import {HsToastService} from '../layout/toast/toast.service';
import {HsUtilsService} from '../utils/utils.service';
import {getShowInLayerManager, getTitle} from '../../common/layer-extensions';

export class HsShareAppData {
  pureMapUrl = '';
  permalinkUrl = '';
  shareLink = 'permalink';
  embedCode = '';
  shareUrlValid = false;
  title = '';
  abstract = '';
  shareUrl = '';
  thumbnail: string;
}

@Injectable({
  providedIn: 'root',
})
export class HsShareService {
  apps: {
    [id: string]: HsShareAppData;
  } = {default: new HsShareAppData()};

  constructor(
    public HsConfig: HsConfig,
    public HsShareUrlService: HsShareUrlService,
    public HsUtilsService: HsUtilsService,
    public HsMapService: HsMapService,
    public HsLayoutService: HsLayoutService,
    public HsSaveMapService: HsSaveMapService,
    public HsEventBusService: HsEventBusService,
    public HsLanguageService: HsLanguageService,
    public HsToastService: HsToastService,
    public HsLogService: HsLogService,
    private HttpClient: HttpClient,
    public HsShareThumbnailService: HsShareThumbnailService
  ) {
    this.HsEventBusService.compositionLoads.subscribe(({data, app}) => {
      if (data.data) {
        data = data.data;
        const appRef = this.get(app);
        appRef.title = data.title;
        if (this.HsConfig.get(app).social_hashtag) {
          appRef.title += ' ' + this.HsConfig.get(app).social_hashtag;
        }
        appRef.abstract = data.abstract;
      }
    });
  }

  /**
   * Get the params saved by the for the current app
   * @param app - App identifier
   */
  get(app: string): HsShareAppData {
    if (this.apps[app ?? 'default'] == undefined) {
      this.apps[app ?? 'default'] = new HsShareAppData();
    }
    return this.apps[app ?? 'default'];
  }

  init(app1: string): void {
    const shareUrlAppRef = this.HsShareUrlService.get(app1);
    this.HsEventBusService.mainPanelChanges.subscribe(async ({which, app}) => {
      if (app != app1) {
        return;
      }
      if (this.HsLayoutService.apps[app].mainpanel == 'permalink') {
        this.generateThumbnail(
          this.HsLayoutService.get(app).contentWrapper.querySelector(
            '.hs-permalink-thumbnail'
          ),
          false,
          app
        );

        shareUrlAppRef.statusSaving = true;
        const status_url = this.HsShareUrlService.endpointUrl(app);
        const layers = this.HsMapService.getLayersArray(app)
          .filter(
            (l) =>
              getShowInLayerManager(l) == undefined || getShowInLayerManager(l)
          )
          .map((lyr: Layer) => {
            return {
              title: getTitle(lyr),
              checked: true,
              layer: lyr,
            };
          })
          .sort((a, b) => {
            return a.layer.getZIndex() - b.layer.getZIndex();
          });
        try {
          const bbox = this.HsMapService.describeExtent(app);
          const data = this.HsSaveMapService.map2json(
            this.HsMapService.getMap(app),
            {layers, bbox},
            {},
            {},
            app
          );
          await this.HsShareUrlService.updatePermalinkComposition(app1, data);
        } catch (ex) {
          shareUrlAppRef.statusSaving = false;
          this.HsLogService.error('Error saving permalink layers.', ex);
          throw ex;
        }
      }
    });

    this.HsShareUrlService.browserUrlUpdated.subscribe(async ({app, url}) => {
      if (
        app1 == app &&
        (this.HsLayoutService.apps[app1].mainpanel == 'permalink' ||
          this.HsLayoutService.apps[app1].mainpanel == 'shareMap')
      ) {
        const appRef = this.get(app);
        appRef.shareUrlValid = false;
        try {
          appRef.pureMapUrl = await this.HsUtilsService.shortUrl(
            this.HsShareUrlService.getPureMapUrl(app1),
            app1
          );
          appRef.permalinkUrl = await this.HsUtilsService.shortUrl(
            this.HsShareUrlService.getPermalinkUrl(app1),
            app1
          );
          this.getEmbedCode(app);
        } catch (ex) {
          this.HsLogService.log('Error creating short URL', ex);
          appRef.pureMapUrl = this.HsShareUrlService.getPureMapUrl(app1);
          appRef.permalinkUrl = url;
        }
      }
    });

    this.HsEventBusService.olMapLoads.subscribe(({map, app}) => {
      map.on(
        'postcompose',
        this.HsUtilsService.debounce(
          () => {
            if (this.HsLayoutService.get(app).mainpanel == 'permalink') {
              this.generateThumbnail(
                this.HsLayoutService.get(app).contentWrapper.querySelector(
                  '.hs-permalink-thumbnail'
                ),
                false,
                app
              );
            }
          },
          300,
          false,
          this
        )
      );
    });
  }

  /**
   * @public
   * @description Get correct Embed code with correct share link type
   * @returns {string} embeddable iframe html code
   */
  getEmbedCode(app: string): string {
    const appRef = this.get(app);
    appRef.embedCode =
      '<iframe src="' +
      this.getShareUrl(app) +
      '" width="1000" height="700"></iframe>';
    return appRef.embedCode;
  }

  /**
   * @public
   * @returns {string} Share URL
   * @description Get share Url based on app choice
   */
  getShareUrl(app: string): string {
    let tmp;
    const appRef = this.get(app);
    if (appRef.shareLink == 'permalink') {
      tmp = appRef.permalinkUrl;
    } else if (appRef.shareLink == 'puremap') {
      tmp = appRef.pureMapUrl;
    }
    return tmp;
  }

  /**
   * @public
   * @returns {string} Encoded share URL
   * @description Get encoded share Url based on app choice
   */
  getShareUrlEncoded(app: string): string {
    return encodeURIComponent(this.getShareUrl(app));
  }

  /**
   * @public
   * @description Make current share url invalid for social sharing
   */
  invalidateShareUrl(app: string): void {
    const appRef = this.get(app);
    appRef.shareUrlValid = false;
  }

  /**
   * @public
   * @param {string} provider Social share provider (twitter/facebook)
   * @param {boolean} newShare If new share record on server should be created
   * @description Share map on social network
   */
  async shareOnSocial(newShare: boolean, app: string): Promise<void> {
    const appRef = this.get(app);
    if (!appRef.shareUrlValid) {
      if (this.HsShareUrlService.get(app).shareId === null || newShare) {
        this.HsShareUrlService.get(app).shareId =
          this.HsUtilsService.generateUuid();
      }
      try {
        const endpointUrl = this.HsShareUrlService.endpointUrl(app);
        const headers = new HttpHeaders().set(
          'Content-Type',
          'text/plain; charset=utf-8'
        );
        await lastValueFrom(
          this.HttpClient.post(
            endpointUrl,
            JSON.stringify({
              request: 'socialShare',
              id: this.HsShareUrlService.get(app).shareId,
              url: encodeURIComponent(this.getShareUrl(app)),
              title: appRef.title,
              description: appRef.abstract,
              image: appRef.thumbnail,
            }),
            {headers, responseType: 'text'}
          )
        );

        const shortUrl = await this.HsUtilsService.shortUrl(
          `${endpointUrl}?request=socialshare&id=${
            this.HsShareUrlService.get(app).shareId
          }`,
          app
        );
        const shareUrl = shortUrl;
        this.openInShareApi(appRef.title, appRef.abstract, shareUrl, app);
        appRef.shareUrlValid = true;
      } catch (ex) {
        this.HsLogService.log('Error creating short URL', ex);
      }
    } else {
      this.openInShareApi(
        appRef.title,
        appRef.abstract,
        this.getShareUrl(app),
        app
      );
    }
  }

  openInShareApi(title, abstract, url, app: string): void {
    (<any>navigator)
      .share({
        title,
        text: abstract || title,
        url,
      })
      .then((response) => {
        console.log(response);
      })
      .catch((error) => {
        const appRef = this.get(app);
        this.HsToastService.createToastPopupMessage(
          this.HsLanguageService.getTranslation(
            'COMPOSITIONS.errorWhileSharingOnSocialNetwork',
            undefined,
            app
          ),
          this.HsLanguageService.getTranslationIgnoreNonExisting(
            'ERRORMESSAGES',
            error,
            undefined,
            app
          ),
          {disableLocalization: true, serviceCalledFrom: 'HsShareService'},
          app
        );
      });
  }

  /**
   * @public
   * @param {object} $element DOM img element where to place the thumbnail
   * @param {boolean} newRender Force synchronous rendering again or use last canvas state
   * @description Generate thumbnail of current map and save it to variable and selected element
   */
  generateThumbnail($element, newRender: boolean, app: string): void {
    this.rendered($element, app, newRender);

    if ($element === null) {
      return;
    }
    $element.setAttribute('crossOrigin', 'Anonymous');
    const map = this.HsMapService.getMap(app);
    if (newRender) {
      map.once('postcompose', () => this.rendered($element, app, newRender));
      map.renderSync();
    } else {
      this.rendered($element, app, newRender);
    }
  }

  rendered($element, app: string, newRender?): void {
    const appRef = this.get(app);
    appRef.thumbnail = this.HsShareThumbnailService.rendered(
      $element,
      app,
      newRender
    );
  }

  private isCanvasTainted(canvas: HTMLCanvasElement): boolean {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const pixel = canvas.getContext('2d').getImageData(0, 0, 1, 1);
      return false;
    } catch (err) {
      return err.code === 18;
    }
  }
}
