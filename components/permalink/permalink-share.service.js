export default ['$rootScope', '$http', 'Core', 'config', 'hs.permalink.urlService', 'Socialshare', 'hs.utils.service', 'hs.map.service', '$q', 'hs.save-map.service',
    function ($rootScope, $http, Core, config, serviceURL, socialshare, utils, OlMap, $q, saveMap) {
        var me = {};
        angular.extend(me, {

            /**
             * @memberof permalink.shareService
             * @property data
             * @public
             * @description variables which describe sharable link: url, title, abstract etc.
             */
            data: {
                pureMapUrl: "",
                permalinkUrl: "",
                shareLink: "permalink",
                embedCode: "",
                shareUrlValid: false,
                title: "",
                abstract: ""
            },

            /**
             * @memberof permalink.shareService
             * @function getEmbedCode
             * @public
             * @description Get correct Embed code with correct share link type
             */
            getEmbedCode: function () {
                me.data.embedCode = '<iframe src="' + me.getShareUrl() + '" width="1000" height="700"></iframe>';
                if (!$rootScope.$$phase) $rootScope.$digest();
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
                if (me.data.shareLink == "permalink") return me.data.permalinkUrl;
                else if (me.data.shareLink == "puremap") return me.data.pureMapUrl;
            },

            /**
             * @memberof permalink.shareService
             * @function setShareType
             * @public
             * @params {String} link Share type to set (permalink/puremap)
             * @description Set share typ and refresh embed code
             */
            setShareType: function (link) {
                me.data.shareLink = link;
                me.getEmbedCode();
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
             * @params {String} provider Social share provider (twitter/facebook/google)
             * @params {Boolean} newShare If new share record on server should be created 
             * @description Share map on social network
             */
            shareOnSocial: function (provider, newShare) {
                if (!me.data.shareUrlValid) {
                    if (serviceURL.shareId == null || newShare) serviceURL.shareId = utils.generateUuid();
                    $http({
                        url: saveMap.endpointUrl(),
                        method: 'POST',
                        data: JSON.stringify({
                            request: 'socialShare',
                            id: serviceURL.shareId,
                            url: encodeURIComponent(me.getShareUrl()),
                            title: me.data.title,
                            description: me.data.abstract,
                            image: me.data.thumbnail
                        })
                    }).then(function (response) {
                        utils.shortUrl(saveMap.endpointUrl() + "?request=socialshare&id=" + serviceURL.shareId)
                            .then(function (shortUrl) {
                                var shareUrl = shortUrl;
                                socialshare.share({
                                    'provider': provider,
                                    'attrs': {
                                        'socialshareText': me.data.title,
                                        'socialshareUrl': shareUrl,
                                        'socialsharePopupHeight': 600,
                                        'socialsharePopupWidth': 500
                                    }
                                })
                                me.data.shareUrlValid = true;
                            }).catch(function () {
                                console.log('Error creating short Url');
                            })

                    }, function (err) {

                    });
                } else {
                    socialshare.share({
                        'provider': provider,
                        'attrs': {
                            'socialshareText': me.data.title,
                            'socialshareUrl': me.getShareUrl(),
                            'socialsharePopupHeight': 600,
                            'socialsharePopupWidth': 500
                        }
                    })
                }
            },

            /**
             * @memberof permalink.shareService
             * @function generateThumbnail
             * @public
             * @params {Object} $element DOM img element where to place the thumbnail
             * @description Generate thumbnail of current map and save it to variable and selected element
             */
            generateThumbnail: function ($element) {
                if (Core.mainpanel == 'saveMap' || Core.mainpanel == 'permalink' || Core.mainpanel == 'shareMap') {
                    $element.setAttribute("crossOrigin", "Anonymous");
                    OlMap.map.once('postcompose', function (event) {
                        var myCanvas = document.getElementById('my_canvas_id');
                        var canvas = event.context.canvas;
                        var canvas2 = document.createElement("canvas");
                        var width = 256,
                            height = 256;
                        canvas2.style.width = width + "px";
                        canvas2.style.height = height + "px";
                        canvas2.width = width;
                        canvas2.height = height;
                        var ctx2 = canvas2.getContext("2d");
                        ctx2.drawImage(canvas, canvas.width / 2 - height / 2, canvas.height / 2 - width / 2, width, height, 0, 0, width, height);
                        try {
                            $element.setAttribute('src', canvas2.toDataURL('image/png'));
                            this.data.thumbnail = canvas2.toDataURL('image/jpeg', 0.8);
                        }
                        catch (e) {
                            $element.setAttribute('src', require('components/save-map/notAvailable.png'));
                        }
                        $element.style.width = width + 'px';
                        $element.style.height = height + 'px';
                    }, me);
                    OlMap.map.renderSync();
                }
            }
        })

        $rootScope.$on('core.mainpanel_changed', function (event) {
            if (Core.mainpanel == 'permalink') {
                serviceURL.update();
                var status_url = saveMap.endpointUrl();
                if (serviceURL.added_layers.length > 0) {
                    $http({
                        url: status_url,
                        method: 'POST',
                        data: JSON.stringify({
                            data: serviceURL.added_layers,
                            permalink: true,
                            id: serviceURL.id,
                            project: config.project_name,
                            request: "save"
                        })
                    }).then(function (response) {
                        serviceURL.permalinkLayers = status_url + "?request=load&id=" + serviceURL.id;
                        $rootScope.$broadcast('browserurl.updated');

                    }, function (err) {
                        console.log('Error saving permalink layers.');
                    });
                } else {
                    $rootScope.$broadcast('browserurl.updated');
                }
            }
        });

        $rootScope.$on('browserurl.updated', function () {
            if (Core.mainpanel == "permalink" || Core.mainpanel == "shareMap") {

                me.data.shareUrlValid = false;

                $q.all([
                    utils.shortUrl(serviceURL.getPureMapUrl())
                        .then(function (shortUrl) {
                            me.data.pureMapUrl = shortUrl;
                        }).catch(function () {
                            console.log('Error creating short Url');
                            me.data.pureMapUrl = serviceURL.getPureMapUrl();
                        }),

                    utils.shortUrl(serviceURL.getPermalinkUrl())
                        .then(function (shortUrl) {
                            me.data.permalinkUrl = shortUrl;
                        }).catch(function () {
                            console.log('Error creating short Url');
                            me.data.permalinkUrl = serviceURL.getPermalinkUrl();
                        })
                ]).then(function () {
                    me.getEmbedCode();
                });

            }
            if (!$rootScope.$$phase) $rootScope.$digest();
        })

        $rootScope.$on('core.mainpanel_changed', function (event) {
            if (Core.mainpanel == 'permalink') {
                OlMap.map.once('postrender', function () {
                    me.generateThumbnail(document.getElementById('hs-permalink-thumbnail'));
                });
            }
        });


        $rootScope.$on('map.extent_changed', function (event) {
            OlMap.map.once('postrender', function () {
                me.generateThumbnail(document.getElementById('hs-permalink-thumbnail'));
            });

        });

        $rootScope.$on('compositions.composition_loaded', function (event, data) {
            if (angular.isDefined(data.data)) {
                data = data.data;
                me.data.title = data.title;
                if (config.social_hashtag) me.data.title += ' ' + config.social_hashtag;
                me.data.abstract = data.abstract;
            }
        })

        return me;
    }]