import {HsConfig} from '../../config.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsLogService} from '../core/log.service';
import {HsMapService} from '../map/map.service';
import {HsShareUrlService} from './share-url.service';
import {HsUtilsService} from '../utils/utils.service';
import {HttpClient} from '@angular/common/http';
import {Injectable, Renderer2} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class HsShareService {
  /**
   * @memberof permalink.shareService
   * @property data
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
  };
  notAvailableImage = require('../../img/notAvailable.png');

  constructor(
    private HsConfig: HsConfig,
    private HsShareUrlService: HsShareUrlService,
    private Socialshare: Socialshare,
    private HsUtilsService: HsUtilsService,
    private HsMapService: HsMapService,
    private HsStatusManagerService: HsStatusManagerService,
    private HsLayoutService: HsLayoutService,
    private HsSaveMapService: HsSaveMapService,
    private HsEventBusService: HsEventBusService,
    private HsLogService: HsLogService,
    private HttpClient: HttpClient,
    private renderer: Renderer2
  ) {
    this.HsEventBusService.mainPanelChanges.subscribe(async () => {
      if (this.HsLayoutService.mainpanel == 'permalink') {
        this.HsShareUrlService.update();
        const status_url = this.HsStatusManagerService.endpointUrl();
        try {
          await this.HttpClient.post(
            status_url,
            JSON.stringify({
              data: this.HsSaveMapService.map2json(
                this.HsMapService.map,
                {},
                {},
                {}
              ),
              permalink: true,
              id: this.HsShareUrlService.id,
              project: this.HsConfig.project_name,
              request: 'save',
            })
          );
          this.HsShareUrlService.permalinkRequestUrl =
            status_url + '?request=load&id=' + this.HsShareUrlService.id;
        } catch (ex) {
          this.HsLogService.log('Error saving permalink layers.', ex);
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
          this.HsLogService.log('Error creating short Url');
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
   * @memberof permalink.shareService
   * @function getEmbedCode
   * @public
   * @description Get correct Embed code with correct share link type
   * @returns {string} embeddable iframe html code
   */
  getEmbedCode() {
    this.data.embedCode =
      '<iframe src="' +
      this.getShareUrl() +
      '" width="1000" height="700"></iframe>';
    return this.data.embedCode;
  }

  /**
   * @memberof permalink.shareService
   * @function getShareUrl
   * @public
   * @returns {string} Share URL
   * @description Get correct share Url based on app choice
   */
  getShareUrl() {
    if (this.data.shareLink == 'permalink') {
      return this.data.permalinkUrl;
    } else if (this.data.shareLink == 'puremap') {
      return this.data.pureMapUrl;
    }
  }

  /**
   * @memberof permalink.shareService
   * @function invalidateShareUrl
   * @public
   * @description Make current share url invalid for social sharing
   */
  invalidateShareUrl() {
    this.data.shareUrlValid = false;
  }

  /**
   * @memberof permalink.shareService
   * @function shareOnSocial
   * @public
   * @param {string} provider Social share provider (twitter/facebook/google)
   * @param {boolean} newShare If new share record on server should be created
   * @description Share map on social network
   */
  async shareOnSocial(provider, newShare) {
    if (!this.data.shareUrlValid) {
      if (this.HsShareUrlService.shareId === null || newShare) {
        this.HsShareUrlService.shareId = this.HsUtilsService.generateUuid();
      }
      try {
        const endpointUrl = this.HsStatusManagerService.endpointUrl();
        await this.HttpClient.post(
          endpointUrl,
          JSON.stringify({
            request: 'socialShare',
            id: this.HsShareUrlService.shareId,
            url: encodeURIComponent(this.getShareUrl()),
            title: this.data.title,
            description: this.data.abstract,
            image: this.data.thumbnail,
          })
        );

        const shortUrl = await this.HsUtilsService.shortUrl(
          `{endpointUrl}?request=socialshare&id=${this.HsShareUrlService.shareId}`
        );

        const shareUrl = shortUrl;
        this.Socialshare.share({
          'provider': provider,
          'attrs': {
            'socialshareText': this.data.title,
            'socialshareUrl': shareUrl,
            'socialsharePopupHeight': 600,
            'socialsharePopupWidth': 500,
          },
        });
        this.data.shareUrlValid = true;
      } catch (ex) {
        this.HsLogService.log('Error creating short Url');
      }
    } else {
      this.Socialshare.share({
        'provider': provider,
        'attrs': {
          'socialshareText': this.data.title,
          'socialshareUrl': this.getShareUrl(),
          'socialsharePopupHeight': 600,
          'socialsharePopupWidth': 500,
        },
      });
    }
  }

  /**
   * @memberof permalink.shareService
   * @function generateThumbnail
   * @public
   * @param {object} $element DOM img element where to place the thumbnail
   * @param {boolean} newRender Force synchronous rendering again or use last canvas state
   * @description Generate thumbnail of current map and save it to variable and selected element
   */
  generateThumbnail($element, newRender: boolean) {
    /**
     * @param canvas
     * @param width
     * @param height
     */
    function setCanvasSize(canvas, width, height) {
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
    }

    /**
     * @param ctx
     */
    function setupContext(ctx) {
      ctx.mozImageSmoothingEnabled = false;
      ctx.webkitImageSmoothingEnabled = false;
      ctx.msImageSmoothingEnabled = false;
      ctx.imageSmoothingEnabled = false;
    }

    /**
     *
     */
    function rendered() {
      const collectorCanvas = this.renderer.createElement('canvas');
      const targetCanvas = this.renderer.createElement('canvas');
      const width = 256,
        height = 256;
      const firstCanvas = this.HsMapService.mapElement.querySelector(
        '.ol-layer canvas'
      );
      setCanvasSize(targetCanvas, width, height);
      setCanvasSize(collectorCanvas, firstCanvas.width, firstCanvas.height);
      const ctxCollector = collectorCanvas.getContext('2d');
      const ctxTarget = targetCanvas.getContext('2d');
      setupContext(ctxTarget);
      setupContext(ctxCollector);
      Array.prototype.forEach.call(
        this.HsMapService.mapElement.querySelectorAll('.ol-layer canvas'),
        (canvas) => {
          if (canvas.width > 0) {
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

      try {
        $element.setAttribute('src', targetCanvas.toDataURL('image/png'));
        this.data.thumbnail = targetCanvas.toDataURL('image/jpeg', 0.85);
      } catch (e) {
        this.HsLogService.warn(e);
        $element.setAttribute('src', this.notAvailableImage);
      }
      $element.style.width = width + 'px';
      $element.style.height = height + 'px';
    }
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
        this.HsMapService.map.once('postcompose', rendered, this);
        this.HsMapService.map.renderSync();
      } else {
        rendered();
      }
    }
  }
}
