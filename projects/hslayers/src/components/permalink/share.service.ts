import 'share-api-polyfill';

import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Injectable, Renderer2, RendererFactory2} from '@angular/core';
import {lastValueFrom} from 'rxjs';

import {HsConfig} from '../../config.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLanguageService} from '../language/language.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsLogService} from '../../common/log/log.service';
import {HsMapService} from '../map/map.service';
import {HsSaveMapService} from '../save-map/save-map.service';
import {HsShareUrlService} from './share-url.service';
import {HsStatusManagerService} from '../save-map/status-manager.service';
import {HsToastService} from '../layout/toast/toast.service';
import {HsUtilsService} from '../utils/utils.service';
import {ShareThumbnailService} from './share-thumbnail.service';
import {getShowInLayerManager} from '../../common/layer-extensions';

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
    public ShareThumbnailService: ShareThumbnailService
  ) {
    this.HsEventBusService.mainPanelChanges.subscribe(async () => {
      if (this.HsLayoutService.mainpanel == 'permalink') {
        this.HsShareUrlService.statusSaving = true;
        const status_url = this.HsStatusManagerService.endpointUrl();
        const layers = this.HsMapService.getLayersArray()
          .filter(
            (l) =>
              getShowInLayerManager(l) == undefined || getShowInLayerManager(l)
          )
          .sort((a, b) => {
            return a.getZIndex() - b.getZIndex();
          });
        try {
          await lastValueFrom(
            this.HttpClient.post(
              status_url,
              JSON.stringify({
                data: this.HsSaveMapService.map2json(
                  this.HsMapService.map,
                  {layers: layers},
                  {},
                  {}
                ),
                permalink: true,
                id: this.HsShareUrlService.id,
                project: this.HsConfig.project_name,
                request: 'save',
              })
            )
          );
          this.HsShareUrlService.statusSaving = false;
          this.HsShareUrlService.permalinkRequestUrl =
            status_url + '?request=load&id=' + this.HsShareUrlService.id;
          this.HsShareUrlService.update();
        } catch (ex) {
          this.HsLogService.error('Error saving permalink layers.', ex);
          throw ex;
        }
      }
    });

    this.HsShareUrlService.browserUrlUpdated.subscribe(async () => {
      if (
        this.HsLayoutService.mainpanel == 'permalink' ||
        this.HsLayoutService.mainpanel == 'shareMap'
      ) {
        this.data.shareUrlValid = false;
        try {
          this.data.pureMapUrl = await this.HsUtilsService.shortUrl(
            this.HsShareUrlService.getPureMapUrl()
          );
          this.data.permalinkUrl = await this.HsUtilsService.shortUrl(
            this.HsShareUrlService.getPermalinkUrl()
          );
          this.getEmbedCode();
        } catch (ex) {
          this.HsLogService.log('Error creating short URL', ex);
          this.data.pureMapUrl = this.HsShareUrlService.getPureMapUrl();
          this.data.permalinkUrl = this.HsShareUrlService.getPermalinkUrl();
        }
      }
    });

    this.HsEventBusService.mainPanelChanges.subscribe(() => {
      if (this.HsLayoutService.mainpanel == 'permalink') {
        this.generateThumbnail(
          this.HsLayoutService.contentWrapper.querySelector(
            '.hs-permalink-thumbnail'
          ),
          false
        );
      }
    });

    this.HsEventBusService.olMapLoads.subscribe((map) => {
      map.on(
        'postcompose',
        this.HsUtilsService.debounce(
          () => {
            if (this.HsLayoutService.mainpanel == 'permalink') {
              this.generateThumbnail(
                this.HsLayoutService.contentWrapper.querySelector(
                  '.hs-permalink-thumbnail'
                ),
                false
              );
            }
          },
          300,
          false,
          this
        )
      );
    });

    this.HsEventBusService.compositionLoads.subscribe((data) => {
      if (data.data) {
        data = data.data;
        this.data.title = data.title;
        if (this.HsConfig.social_hashtag) {
          this.data.title += ' ' + this.HsConfig.social_hashtag;
        }
        this.data.abstract = data.abstract;
      }
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
  async shareOnSocial(newShare: boolean): Promise<void> {
    if (!this.data.shareUrlValid) {
      if (this.HsShareUrlService.shareId === null || newShare) {
        this.HsShareUrlService.shareId = this.HsUtilsService.generateUuid();
      }
      try {
        const endpointUrl = this.HsStatusManagerService.endpointUrl();
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
          `${endpointUrl}?request=socialshare&id=${this.HsShareUrlService.shareId}`
        );
        const shareUrl = shortUrl;
        this.openInShareApi(this.data.title, this.data.abstract, shareUrl);
        this.data.shareUrlValid = true;
      } catch (ex) {
        this.HsLogService.log('Error creating short URL', ex);
      }
    } else {
      this.openInShareApi(
        this.data.title,
        this.data.abstract,
        this.getShareUrl()
      );
    }
  }

  openInShareApi(title, abstract, url): void {
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
            'COMPOSITIONS.errorWhileSharingOnSocialNetwork'
          ),
          this.HsLanguageService.getTranslationIgnoreNonExisting(
            'ERRORMESSAGES',
            error
          ),
          {disableLocalization: true, serviceCalledFrom: 'HsShareService'}
        );
      });
  }

  /**
   * @public
   * @param {object} $element DOM img element where to place the thumbnail
   * @param {boolean} newRender Force synchronous rendering again or use last canvas state
   * @description Generate thumbnail of current map and save it to variable and selected element
   */
  generateThumbnail($element, newRender: boolean): void {
    this.rendered($element, newRender);

    if ($element === null) {
      return;
    }
    $element.setAttribute('crossOrigin', 'Anonymous');

    if (newRender) {
      this.HsMapService.map.once('postcompose', () =>
        this.rendered($element, newRender)
      );
      this.HsMapService.map.renderSync();
    } else {
      this.rendered($element, newRender);
    }
  }

  rendered($element, newRender?): void {
    this.data.thumbnail = this.ShareThumbnailService.rendered(
      $element,
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
