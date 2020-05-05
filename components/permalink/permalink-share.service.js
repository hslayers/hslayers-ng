/* eslint-disable angular/on-watch */
export default [
  '$rootScope',
  '$http',
  'Core',
  'config',
  'hs.permalink.urlService',
  'Socialshare',
  'hs.utils.service',
  'hs.map.service',
  '$q',
  'hs.statusManagerService',
  'hs.layout.service',
  '$log',
  '$timeout',
  '$document',
  'hs.save-map.service',
  function (
    $rootScope,
    $http,
    Core,
    config,
    serviceURL,
    socialshare,
    utils,
    OlMap,
    $q,
    statusManagerService,
    layoutService,
    $log,
    $timeout,
    $document,
    saveMap
  ) {
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
       * @return {String} embeddable iframe html code
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
       * @return {String} Share URL
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
       * @param {String} provider Social share provider (twitter/facebook/google)
       * @param {Boolean} newShare If new share record on server should be created
       * @description Share map on social network
       */
      async shareOnSocial(provider, newShare) {
        if (!me.data.shareUrlValid) {
          if (serviceURL.shareId === null || newShare) {
            serviceURL.shareId = utils.generateUuid();
          }
          try {
            const endpointUrl = statusManagerService.endpointUrl();
            await $http({
              url: endpointUrl,
              method: 'POST',
              data: angular.toJson({
                request: 'socialShare',
                id: serviceURL.shareId,
                url: encodeURIComponent(me.getShareUrl()),
                title: me.data.title,
                description: me.data.abstract,
                image: me.data.thumbnail,
              }),
            });

            const shortUrl = await utils.shortUrl(
              endpointUrl + '?request=socialshare&id=' + serviceURL.shareId
            );

            const shareUrl = shortUrl;
            socialshare.share({
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
          socialshare.share({
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
       * @param {Object} $element DOM img element where to place the thumbnail
       * @param {Boolean} newRender Force synchronous rendering again or use last canvas state
       * @description Generate thumbnail of current map and save it to variable and selected element
       */
      generateThumbnail: function ($element, newRender) {
        function rendered() {
          const canvas = OlMap.getCanvas();
          const canvas2 = $document[0].createElement('canvas');
          const width = 256,
            height = 256;
          canvas2.width = width;
          canvas2.height = height;

          canvas2.style.width = width + 'px';
          canvas2.style.height = height + 'px';
          const ctx2 = canvas2.getContext('2d');
          ctx2.mozImageSmoothingEnabled = false;
          ctx2.webkitImageSmoothingEnabled = false;
          ctx2.msImageSmoothingEnabled = false;
          ctx2.imageSmoothingEnabled = false;
          ctx2.drawImage(
            canvas,
            canvas.width / 2 - width / 2,
            canvas.height / 2 - height / 2,
            width,
            height,
            0,
            0,
            width,
            height
          );
          try {
            $element.setAttribute('src', canvas2.toDataURL('image/png'));
            me.data.thumbnail = canvas2.toDataURL('image/jpeg', 0.85);
          } catch (e) {
            $log.warn(e);
            $element.setAttribute(
              'src',
              require('../save-map/notAvailable.png')
            );
          }
          $element.style.width = width + 'px';
          $element.style.height = height + 'px';
        }
        if (
          layoutService.mainpanel == 'saveMap' ||
          layoutService.mainpanel == 'permalink' ||
          layoutService.mainpanel == 'shareMap'
        ) {
          if ($element === null) {
            return;
          }
          $element.setAttribute('crossOrigin', 'Anonymous');

          OlMap.map.once('postcompose', rendered, me);
          if (newRender) {
            OlMap.map.renderSync();
          } else {
            rendered();
          }
        }
      },
    });

    // eslint-disable-next-line angular/on-watch
    $rootScope.$on('core.mainpanel_changed', async (event) => {
      if (layoutService.mainpanel == 'permalink') {
        serviceURL.update();
        const status_url = statusManagerService.endpointUrl();
        try {
          await $http({
            url: status_url,
            method: 'POST',
            data: angular.toJson({
              data: saveMap.map2json(OlMap.map, {}, {}, {}),
              permalink: true,
              id: serviceURL.id,
              project: config.project_name,
              request: 'save',
            }),
          });
          serviceURL.permalinkRequestUrl =
            status_url + '?request=load&id=' + serviceURL.id;
          $rootScope.$broadcast('browserurl.updated');
        } catch (ex) {
          $log.log('Error saving permalink layers.');
        }
      }
    });

    $rootScope.$on('browserurl.updated', async () => {
      if (
        layoutService.mainpanel == 'permalink' ||
        layoutService.mainpanel == 'shareMap'
      ) {
        me.data.shareUrlValid = false;
        try {
          me.data.pureMapUrl = await utils.shortUrl(serviceURL.getPureMapUrl());
          me.data.permalinkUrl = await utils.shortUrl(
            serviceURL.getPermalinkUrl()
          );
          $timeout(() => {}, 0);
          me.getEmbedCode();
        } catch (ex) {
          $log.log('Error creating short Url');
          me.data.pureMapUrl = serviceURL.getPureMapUrl();
          me.data.permalinkUrl = serviceURL.getPermalinkUrl();
        }
      }
    });

    $rootScope.$on('core.mainpanel_changed', (event) => {
      if (layoutService.mainpanel == 'permalink') {
        me.generateThumbnail(
          layoutService.contentWrapper.querySelector('.hs-permalink-thumbnail')
        );
      }
    });

    $rootScope.$on('map.loaded', (e) => {
      OlMap.map.on(
        'postcompose',
        utils.debounce(
          () => {
            me.generateThumbnail(
              layoutService.contentWrapper.querySelector(
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

    $rootScope.$on('compositions.composition_loaded', (event, data) => {
      if (angular.isDefined(data.data)) {
        data = data.data;
        me.data.title = data.title;
        if (config.social_hashtag) {
          me.data.title += ' ' + config.social_hashtag;
        }
        me.data.abstract = data.abstract;
      }
    });

    return me;
  },
];
