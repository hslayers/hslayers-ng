import 'share-api-polyfill';

import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {lastValueFrom} from 'rxjs';

import {CompoData} from 'hslayers-ng/types';
import {HsConfig} from 'hslayers-ng/config';
import {HsEndpoint} from 'hslayers-ng/types';
import {HsEventBusService} from 'hslayers-ng/shared/event-bus';
import {HsLanguageService} from 'hslayers-ng/shared/language';
import {HsLayoutService} from 'hslayers-ng/shared/layout';
import {HsLogService} from 'hslayers-ng/shared/log';
import {HsMapService} from 'hslayers-ng/shared/map';
import {HsSaveMapService} from 'hslayers-ng/shared/save-map';
import {HsShareThumbnailService} from 'hslayers-ng/shared/share';
import {HsShareUrlService} from './share-url.service';
import {HsToastService} from 'hslayers-ng/common/toast';
import {HsUtilsService} from 'hslayers-ng/shared/utils';
import {MapComposition} from 'hslayers-ng/types';
import {getShowInLayerManager} from 'hslayers-ng/common/extensions';

@Injectable({
  providedIn: 'root',
})
export class HsShareService {
  pureMapUrl = '';
  permalinkUrl = '';
  shareLink = 'permalink';
  embedCode = '';
  shareUrlValid = false;
  title = '';
  abstract = '';
  shareUrl = '';
  thumbnail: string;
  constructor(
    public hsConfig: HsConfig,
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
    public HsShareThumbnailService: HsShareThumbnailService,
  ) {
    this.HsEventBusService.compositionLoads.subscribe((data) => {
      if (data.data) {
        data = data.data;

        this.title = data.title;
        if (this.hsConfig.social_hashtag) {
          this.title += ' ' + this.hsConfig.social_hashtag;
        }
        this.abstract = data.abstract;
      }
    });

    this.HsLayoutService.mainpanel$.subscribe(async (which) => {
      if (this.HsLayoutService.mainpanel == 'share') {
        this.generateThumbnail(
          this.HsLayoutService.contentWrapper.querySelector(
            '.hs-permalink-thumbnail',
          ),
          false,
        );

        this.HsShareUrlService.statusSaving = true;
        const layers = this.HsMapService.getLayersArray()
          .filter(
            (l) =>
              getShowInLayerManager(l) == undefined || getShowInLayerManager(l),
          )
          .sort((a, b) => {
            return a.getZIndex() - b.getZIndex();
          });
        try {
          const bbox = this.HsMapService.describeExtent();
          const data = this.HsSaveMapService.map2json(
            this.HsMapService.getMap(),
            {layers, bbox},
            {},
            {},
          );
          await this.HsShareUrlService.updatePermalinkComposition(data);
        } catch (ex) {
          this.HsShareUrlService.statusSaving = false;
          this.HsLogService.error('Error saving permalink layers.', ex);
          throw ex;
        }
      }
    });

    this.HsShareUrlService.browserUrlUpdated.subscribe(async (url) => {
      if (
        this.HsLayoutService.mainpanel == 'share' ||
        this.HsLayoutService.mainpanel == 'shareMap'
      ) {
        this.shareUrlValid = false;
        try {
          this.pureMapUrl = await this.HsUtilsService.shortUrl(
            this.HsShareUrlService.getPureMapUrl(),
          );
          this.permalinkUrl = await this.HsUtilsService.shortUrl(
            this.HsShareUrlService.getPermalinkUrl(),
          );
          this.getEmbedCode();
        } catch (ex) {
          this.HsLogService.log('Error creating short URL', ex);
          this.pureMapUrl = this.HsShareUrlService.getPureMapUrl();
          this.permalinkUrl = url;
        }
      }
    });

    this.HsEventBusService.olMapLoads.subscribe((map) => {
      map.on(
        'postcompose',
        this.HsUtilsService.debounce(
          () => {
            if (this.HsLayoutService.mainpanel == 'share') {
              this.generateThumbnail(
                this.HsLayoutService.contentWrapper.querySelector(
                  '.hs-permalink-thumbnail',
                ),
                false,
              );
            }
          },
          300,
          false,
          this,
        ),
      );
    });
  }

  /**
   * Get correct Embed code with correct share link type
   * @public
   * @returns embeddable iframe HTML code
   */
  getEmbedCode(): string {
    this.embedCode =
      '<iframe src="' +
      this.getShareUrl() +
      '" width="1000" height="700"></iframe>';
    return this.embedCode;
  }

  /**
   * @public
   * @returns Share URL
   */
  getShareUrl(): string {
    let tmp;
    if (this.shareLink == 'permalink') {
      tmp = this.permalinkUrl;
    } else if (this.shareLink == 'puremap') {
      tmp = this.pureMapUrl;
    }
    return tmp;
  }

  /**
   * @public
   * @returns Encoded share URL
   */
  getShareUrlEncoded(): string {
    return encodeURIComponent(this.getShareUrl());
  }

  /**
   * Make current share url invalid for social sharing
   * @public
   */
  invalidateShareUrl(): void {
    this.shareUrlValid = false;
  }

  /**
   * Share map on social network
   * @public
   * @param provider - Social share provider (twitter/facebook)
   * @param newShare - If new share record on server should be created
   */
  async shareOnSocial(newShare: boolean): Promise<void> {
    if (!this.shareUrlValid) {
      if (this.HsShareUrlService.shareId === null || newShare) {
        this.HsShareUrlService.shareId = this.HsUtilsService.generateUuid();
      }
      try {
        const endpointUrl = this.HsShareUrlService.endpointUrl();
        const headers = new HttpHeaders().set(
          'Content-Type',
          'text/plain; charset=utf-8',
        );
        await lastValueFrom(
          this.HttpClient.post(
            endpointUrl,
            JSON.stringify({
              request: 'socialShare',
              id: this.HsShareUrlService.shareId,
              url: encodeURIComponent(this.getShareUrl()),
              title: this.title,
              description: this.abstract,
              image: this.thumbnail,
            }),
            {headers, responseType: 'text'},
          ),
        );

        const shortUrl = await this.HsUtilsService.shortUrl(
          `${endpointUrl}?request=socialshare&id=${this.HsShareUrlService.shareId}`,
        );
        const shareUrl = shortUrl;
        this.openInShareApi(this.title, this.abstract, shareUrl);
        this.shareUrlValid = true;
      } catch (ex) {
        this.HsLogService.log('Error creating short URL', ex);
      }
    } else {
      this.openInShareApi(this.title, this.abstract, this.getShareUrl());
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
            'COMPOSITIONS.errorWhileSharingOnSocialNetwork',
            undefined,
          ),
          this.HsLanguageService.getTranslationIgnoreNonExisting(
            'ERRORMESSAGES',
            error,
            undefined,
          ),
          {disableLocalization: true, serviceCalledFrom: 'HsShareService'},
        );
      });
  }

  /**
   * Generate thumbnail of current map and save it to variable and selected element
   * @public
   * @param $element - DOM img element where to place the thumbnail
   * @param newRender - Force synchronous rendering again or use last canvas state
   */
  generateThumbnail($element, newRender: boolean): void {
    this.rendered($element, newRender);

    if ($element === null) {
      return;
    }
    $element.setAttribute('crossOrigin', 'Anonymous');
    const map = this.HsMapService.getMap();
    if (newRender) {
      map.once('postcompose', () => this.rendered($element, newRender));
      map.renderSync();
    } else {
      this.rendered($element, newRender);
    }
  }

  rendered($element, newRender?): void {
    this.thumbnail = this.HsShareThumbnailService.rendered($element, newRender);
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

  /**
   * Save composition to Status manager's service
   * @param compositionJson - Json with composition's definition
   * @param endpoint - Endpoint's description
   * @param compoData - Additional data for composition
   * @param saveAsNew - Save as new composition
   * @returns Promise result of POST
   */
  save(
    compositionJson: MapComposition,
    endpoint: HsEndpoint,
    compoData: CompoData,
    saveAsNew: boolean,
  ): Promise<any> {
    if (saveAsNew || compoData.id == '') {
      compoData.id = this.HsUtilsService.generateUuid();
    }
    return new Promise(async (resolve, reject) => {
      try {
        const response = await lastValueFrom(
          this.HttpClient.post(this.HsShareUrlService.endpointUrl(), {
            data: compositionJson,
            permanent: true,
            id: compoData.id,
            project: this.hsConfig.project_name,
            thumbnail: compoData.thumbnail,
            request: 'save',
          }),
        );
        resolve(response);
      } catch (err) {
        reject();
      }
    });
  }
}
