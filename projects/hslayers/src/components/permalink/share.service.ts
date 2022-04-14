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
import {HsStatusManagerService} from '../save-map/status-manager.service';
import {HsToastService} from '../layout/toast/toast.service';
import {HsUtilsService} from '../utils/utils.service';
import {getShowInLayerManager, getTitle} from '../../common/layer-extensions';

@Injectable({
  providedIn: 'root',
})
export class HsShareService {
  /**
   * @public
   * @description variables which describe sharable link: url, title, abstract etc.
   */
  data: any = {
    pureMapUrl: '',
    permalinkUrl: '',
    shareLink: 'permalink',
    embedCode: '',
    shareUrlValid: false,
    title: '',
    abstract: '',
    shareUrl: '',
  };
  constructor(
    public HsConfig: HsConfig,
    public HsShareUrlService: HsShareUrlService,
    public HsUtilsService: HsUtilsService,
    public HsMapService: HsMapService,
    public HsStatusManagerService: HsStatusManagerService,
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
        this.data.title = data.title;
        if (this.HsConfig.get(app).social_hashtag) {
          this.data.title += ' ' + this.HsConfig.get(app).social_hashtag;
        }
        this.data.abstract = data.abstract;
      }
    });
  }

  init(app1: string): void {
    this.HsEventBusService.mainPanelChanges.subscribe(async ({which, app}) => {
      if (this.HsLayoutService.apps[app].mainpanel == 'permalink') {
        this.generateThumbnail(
          this.HsLayoutService.get(app).contentWrapper.querySelector(
            '.hs-permalink-thumbnail'
          ),
          false,
          app
        );

        this.HsShareUrlService.statusSaving = true;
        const status_url = this.HsStatusManagerService.endpointUrl(app);
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
          await lastValueFrom(
            this.HttpClient.post(
              status_url,
              JSON.stringify({
                data,
                permalink: true,
                id: this.HsShareUrlService.id,
                project: this.HsConfig.get(app1).project_name,
                request: 'save',
              })
            )
          );
          this.HsShareUrlService.statusSaving = false;
          this.HsShareUrlService.permalinkRequestUrl =
            status_url + '?request=load&id=' + this.HsShareUrlService.id;
          this.HsShareUrlService.update(app1);
        } catch (ex) {
          this.HsLogService.error('Error saving permalink layers.', ex);
          throw ex;
        }
      }
    });

    this.HsShareUrlService.browserUrlUpdated.subscribe(async () => {
      if (
        this.HsLayoutService.apps[app1].mainpanel == 'permalink' ||
        this.HsLayoutService.apps[app1].mainpanel == 'shareMap'
      ) {
        this.data.shareUrlValid = false;
        try {
          this.data.pureMapUrl = await this.HsUtilsService.shortUrl(
            this.HsShareUrlService.getPureMapUrl(app1),
            app1
          );
          this.data.permalinkUrl = await this.HsUtilsService.shortUrl(
            this.HsShareUrlService.getPermalinkUrl(app1),
            app1
          );
          this.getEmbedCode();
        } catch (ex) {
          this.HsLogService.log('Error creating short URL', ex);
          this.data.pureMapUrl = this.HsShareUrlService.getPureMapUrl(app1);
          this.data.permalinkUrl = this.HsShareUrlService.getPermalinkUrl(app1);
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
  getEmbedCode(): string {
    this.data.embedCode =
      '<iframe src="' +
      this.getShareUrl() +
      '" width="1000" height="700"></iframe>';
    return this.data.embedCode;
  }

  /**
   * @public
   * @returns {string} Share URL
   * @description Get share Url based on app choice
   */
  getShareUrl(): string {
    let tmp;
    if (this.data.shareLink == 'permalink') {
      tmp = this.data.permalinkUrl;
    } else if (this.data.shareLink == 'puremap') {
      tmp = this.data.pureMapUrl;
    }
    return tmp;
  }

  /**
   * @public
   * @returns {string} Encoded share URL
   * @description Get encoded share Url based on app choice
   */
  getShareUrlEncoded(): string {
    return encodeURIComponent(this.getShareUrl());
  }

  /**
   * @public
   * @description Make current share url invalid for social sharing
   */
  invalidateShareUrl(): void {
    this.data.shareUrlValid = false;
  }

  /**
   * @public
   * @param {string} provider Social share provider (twitter/facebook)
   * @param {boolean} newShare If new share record on server should be created
   * @description Share map on social network
   */
  async shareOnSocial(newShare: boolean, app: string): Promise<void> {
    if (!this.data.shareUrlValid) {
      if (this.HsShareUrlService.shareId === null || newShare) {
        this.HsShareUrlService.shareId = this.HsUtilsService.generateUuid();
      }
      try {
        const endpointUrl = this.HsStatusManagerService.endpointUrl(app);
        const headers = new HttpHeaders().set(
          'Content-Type',
          'text/plain; charset=utf-8'
        );
        await lastValueFrom(
          this.HttpClient.post(
            endpointUrl,
            JSON.stringify({
              request: 'socialShare',
              id: this.HsShareUrlService.shareId,
              url: encodeURIComponent(this.getShareUrl()),
              title: this.data.title,
              description: this.data.abstract,
              image: this.data.thumbnail,
            }),
            {headers, responseType: 'text'}
          )
        );

        const shortUrl = await this.HsUtilsService.shortUrl(
          `${endpointUrl}?request=socialshare&id=${this.HsShareUrlService.shareId}`,
          app
        );
        const shareUrl = shortUrl;
        this.openInShareApi(this.data.title, this.data.abstract, shareUrl, app);
        this.data.shareUrlValid = true;
      } catch (ex) {
        this.HsLogService.log('Error creating short URL', ex);
      }
    } else {
      this.openInShareApi(
        this.data.title,
        this.data.abstract,
        this.getShareUrl(),
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
        this.HsToastService.createToastPopupMessage(
          this.HsLanguageService.getTranslation(
            'COMPOSITIONS.errorWhileSharingOnSocialNetwork',
            undefined,
            this.data.app
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
    this.data.thumbnail = this.HsShareThumbnailService.rendered(
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
