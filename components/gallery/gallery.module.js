import galleryController from './gallery.controller';

/**
 * @namespace hs.gallery
 * @memberOf hs
 */
angular
  .module('hs.gallery', [])

  /**
   * @memberof hs.gallery
   * @ngdoc component
   * @name hs.gallery
   * @description Initialize embedded gallery component
   */
  .component('hsGallery', {
    template: require('./partials/gallery.html'),
    controller: galleryController,
    bindings: {
      images: '<'
    },
  });
