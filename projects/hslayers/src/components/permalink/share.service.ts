import 'share-api-polyfill';

import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Injectable, Renderer2, RendererFactory2} from '@angular/core';

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
  private renderer: Renderer2;

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
    rendererFactory: RendererFactory2
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);
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
          await this.HttpClient.post(
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
          ).toPromise();
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
            this.generateThumbnail(
              this.HsLayoutService.contentWrapper.querySelector(
                '.hs-permalink-thumbnail'
              ),
              false
            );
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
        await this.HttpClient.post(
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
        ).toPromise();

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
    if (
      this.HsLayoutService.mainpanel == 'saveMap' ||
      this.HsLayoutService.mainpanel == 'permalink' ||
      this.HsLayoutService.mainpanel == 'shareMap'
    ) {
      if ($element === null) {
        return;
      }
      $element.setAttribute('crossOrigin', 'Anonymous');

      if (newRender) {
        this.rendered.bind(this);
        this.HsMapService.map.once('postcompose', () =>
          this.rendered($element, newRender)
        );
        this.HsMapService.map.renderSync();
      } else {
        this.rendered($element, newRender);
      }
    }
  }

  /**
   * @param canvas
   * @param width
   * @param height
   */
  setCanvasSize(canvas, width: number, height: number): void {
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
  }

  /**
   * @param ctx
   */
  setupContext(ctx): void {
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
    ctx.imageSmoothingEnabled = false;
  }

  rendered($element, newRender?): void {
    if (!$element) {
      return;
    }
    const collectorCanvas = this.renderer.createElement('canvas');
    const targetCanvas = this.renderer.createElement('canvas');
    const width = 256,
      height = 256;
    const firstCanvas =
      this.HsMapService.mapElement.querySelector('.ol-layer canvas');
    this.setCanvasSize(targetCanvas, width, height);
    this.setCanvasSize(collectorCanvas, firstCanvas.width, firstCanvas.height);
    const ctxCollector = collectorCanvas.getContext('2d');
    const ctxTarget = targetCanvas.getContext('2d');
    this.setupContext(ctxTarget);
    this.setupContext(ctxCollector);
    Array.prototype.forEach.call(
      this.HsMapService.mapElement.querySelectorAll('.ol-layer canvas'),
      (canvas) => {
        if (canvas.width > 0) {
          //console.log('canvas loop', this.isCanvasTainted(canvas), canvas);
          /* canvases retrieved from mapElement might be already tainted because they can contain
           * images (i.e. maps) retrieved from another sources without CORS
           */
          const opacity = canvas.parentNode.style.opacity;
          ctxCollector.globalAlpha = opacity === '' ? 1 : Number(opacity);
          const transform = canvas.style.transform;
          // Get the transform parameters from the style's transform matrix
          const matrix = transform
            .match(/^matrix\(([^\(]*)\)$/)[1]
            .split(',')
            .map(Number);
          // Apply the transform to the export map context
          CanvasRenderingContext2D.prototype.setTransform.apply(
            ctxCollector,
            matrix
          );
          ctxCollector.drawImage(canvas, 0, 0);
        }
      }
    );

    /* Final render pass */
    ctxTarget.drawImage(
      collectorCanvas,
      Math.floor(collectorCanvas.width / 2 - width / 2),
      Math.floor(collectorCanvas.height / 2 - height / 2),
      width,
      height,
      0,
      0,
      width,
      height
    );
    //console.log('image drawn', this.isCanvasTainted(targetCanvas));
    /**
     * from now on, the targetCanvas is also tainted because another tainted canvas was used
     * to draw inside it
     */

    try {
      /**
       * targetCanvas.toDataURL() fires a SecurityError here
       * see https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image#security_and_tainted_canvases
       */
      $element.setAttribute('src', targetCanvas.toDataURL('image/png'));
      this.data.thumbnail = targetCanvas.toDataURL('image/jpeg', 0.85);
    } catch (e) {
      console.log('catched, is tainted?', this.isCanvasTainted(targetCanvas));
      //console.log(targetCanvas);
      this.HsLogService.warn(e);
      $element.setAttribute(
        'src',
        this.HsUtilsService.getAssetsPath() + 'img/notAvailable.png'
      );
    }
    $element.style.width = width + 'px';
    $element.style.height = height + 'px';
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
