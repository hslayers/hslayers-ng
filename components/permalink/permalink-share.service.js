/* eslint-disable angular/on-watch */
/**
 * @param $rootScope
 * @param $http
 * @param HsConfig
 * @param HsPermalinkUrlService
 * @param Socialshare
 * @param HsUtilsService
 * @param HsMapService
 * @param HsStatusManagerService
 * @param HsLayoutService
 * @param $log
 * @param $timeout
 * @param $document
 * @param HsSaveMapService
 */
export default function (
  $rootScope,
  $http,
  HsConfig,
  HsPermalinkUrlService,
  Socialshare,
  HsUtilsService,
  HsMapService,
  HsStatusManagerService,
  HsLayoutService,
  $log,
  $timeout,
  $document,
  HsSaveMapService,
  HsEventBusService
) {
  'ngInject';
  const me = {};
  angular.extend(me, {
    /**
     * @memberof permalink.shareService
     * @property data
     * @public
     * @description variables which describe sharable link: url, title, abstract etc.
     */
    data: {
      pureMapUrl: '',
      permalinkUrl: '',
      shareLink: 'permalink',
      embedCode: '',
      shareUrlValid: false,
      title: '',
      abstract: '',
    },

    /**
     * @memberof permalink.shareService
     * @function getEmbedCode
     * @public
     * @description Get correct Embed code with correct share link type
     * @returns {string} embeddable iframe html code
     */
    getEmbedCode: function () {
      me.data.embedCode =
        '<iframe src="' +
        me.getShareUrl() +
        '" width="1000" height="700"></iframe>';
      return me.data.embedCode;
    },

    /**
     * @memberof permalink.shareService
     * @function getShareUrl
     * @public
     * @returns {string} Share URL
     * @description Get correct share Url based on app choice
     */
    getShareUrl: function () {
      if (me.data.shareLink == 'permalink') {
        return me.data.permalinkUrl;
      } else if (me.data.shareLink == 'puremap') {
        return me.data.pureMapUrl;
      }
    },

    /**
     * @memberof permalink.shareService
     * @function invalidateShareUrl
     * @public
     * @description Make current share url invalid for social sharing
     */
    invalidateShareUrl: function () {
      me.data.shareUrlValid = false;
    },

    /**
     * @memberof permalink.shareService
     * @function shareOnSocial
     * @public
     * @param {string} provider Social share provider (twitter/facebook/google)
     * @param {boolean} newShare If new share record on server should be created
     * @description Share map on social network
     */
    async shareOnSocial(provider, newShare) {
      if (!me.data.shareUrlValid) {
        if (HsPermalinkUrlService.shareId === null || newShare) {
          HsPermalinkUrlService.shareId = HsUtilsService.generateUuid();
        }
        try {
          const endpointUrl = HsStatusManagerService.endpointUrl();
          await $http({
            url: endpointUrl,
            method: 'POST',
            data: angular.toJson({
              request: 'socialShare',
              id: HsPermalinkUrlService.shareId,
              url: encodeURIComponent(me.getShareUrl()),
              title: me.data.title,
              description: me.data.abstract,
              image: me.data.thumbnail,
            }),
          });

          const shortUrl = await HsUtilsService.shortUrl(
            endpointUrl +
              '?request=socialshare&id=' +
              HsPermalinkUrlService.shareId
          );

          const shareUrl = shortUrl;
          Socialshare.share({
            'provider': provider,
            'attrs': {
              'socialshareText': me.data.title,
              'socialshareUrl': shareUrl,
              'socialsharePopupHeight': 600,
              'socialsharePopupWidth': 500,
            },
          });
          me.data.shareUrlValid = true;
        } catch (ex) {
          $log.log('Error creating short Url');
        }
      } else {
        Socialshare.share({
          'provider': provider,
          'attrs': {
            'socialshareText': me.data.title,
            'socialshareUrl': me.getShareUrl(),
            'socialsharePopupHeight': 600,
            'socialsharePopupWidth': 500,
          },
        });
      }
    },

    /**
     * @memberof permalink.shareService
     * @function generateThumbnail
     * @public
     * @param {object} $element DOM img element where to place the thumbnail
     * @param {boolean} newRender Force synchronous rendering again or use last canvas state
     * @description Generate thumbnail of current map and save it to variable and selected element
     */
    generateThumbnail: function ($element, newRender) {
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
        const collectorCanvas = $document[0].createElement('canvas');
        const targetCanvas = $document[0].createElement('canvas');
        const width = 256,
          height = 256;
        const firstCanvas = HsMapService.mapElement.querySelector(
          '.ol-layer canvas'
        );
        setCanvasSize(targetCanvas, width, height);
        setCanvasSize(collectorCanvas, firstCanvas.width, firstCanvas.height);
        const ctxCollector = collectorCanvas.getContext('2d');
        const ctxTarget = targetCanvas.getContext('2d');
        setupContext(ctxTarget);
        setupContext(ctxCollector);
        Array.prototype.forEach.call(
          HsMapService.mapElement.querySelectorAll('.ol-layer canvas'),
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
          me.data.thumbnail = targetCanvas.toDataURL('image/jpeg', 0.85);
        } catch (e) {
          $log.warn(e);
          $element.setAttribute('src', require('../save-map/notAvailable.png'));
        }
        $element.style.width = width + 'px';
        $element.style.height = height + 'px';
      }
      if (
        HsLayoutService.mainpanel == 'saveMap' ||
        HsLayoutService.mainpanel == 'permalink' ||
        HsLayoutService.mainpanel == 'shareMap'
      ) {
        if ($element === null) {
          return;
        }
        $element.setAttribute('crossOrigin', 'Anonymous');

        if (newRender) {
          HsMapService.map.once('postcompose', rendered, me);
          HsMapService.map.renderSync();
        } else {
          rendered();
        }
      }
    },
  });

  // eslint-disable-next-line angular/on-watch
  HsEventBusService.mainPanelChanges.subscribe(async () => {
    if (HsLayoutService.mainpanel == 'permalink') {
      HsPermalinkUrlService.update();
      const status_url = HsStatusManagerService.endpointUrl();
      try {
        await $http({
          url: status_url,
          method: 'POST',
          data: angular.toJson({
            data: HsSaveMapService.map2json(HsMapService.map, {}, {}, {}),
            permalink: true,
            id: HsPermalinkUrlService.id,
            project: HsConfig.project_name,
            request: 'save',
          }),
        });
        HsPermalinkUrlService.permalinkRequestUrl =
          status_url + '?request=load&id=' + HsPermalinkUrlService.id;
      } catch (ex) {
        $log.log('Error saving permalink layers.', ex);
      } finally {
        $rootScope.$broadcast('browserurl.updated');
      }
    }
  });

  $rootScope.$on('browserurl.updated', async () => {
    if (
      HsLayoutService.mainpanel == 'permalink' ||
      HsLayoutService.mainpanel == 'shareMap'
    ) {
      me.data.shareUrlValid = false;
      try {
        me.data.pureMapUrl = await HsUtilsService.shortUrl(
          HsPermalinkUrlService.getPureMapUrl()
        );
        me.data.permalinkUrl = await HsUtilsService.shortUrl(
          HsPermalinkUrlService.getPermalinkUrl()
        );
        $timeout(() => {}, 0);
        me.getEmbedCode();
      } catch (ex) {
        $log.log('Error creating short Url');
        me.data.pureMapUrl = HsPermalinkUrlService.getPureMapUrl();
        me.data.permalinkUrl = HsPermalinkUrlService.getPermalinkUrl();
      }
    }
  });

  HsEventBusService.mainPanelChanges.subscribe(() => {
    if (HsLayoutService.mainpanel == 'permalink') {
      me.generateThumbnail(
        HsLayoutService.contentWrapper.querySelector('.hs-permalink-thumbnail')
      );
    }
  });

  $rootScope.$on('map.loaded', (e) => {
    HsMapService.map.on(
      'postcompose',
      HsUtilsService.debounce(
        () => {
          me.generateThumbnail(
            HsLayoutService.contentWrapper.querySelector(
              '.hs-permalink-thumbnail'
            )
          );
        },
        300,
        false,
        me
      )
    );
  });

  HsEventBusService.compositionLoads.subscribe((data) => {
    if (angular.isDefined(data.data)) {
      data = data.data;
      me.data.title = data.title;
      if (HsConfig.social_hashtag) {
        me.data.title += ' ' + HsConfig.social_hashtag;
      }
      me.data.abstract = data.abstract;
    }
  });

  return me;
}
