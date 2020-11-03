export default function () {
  const ctrl = this;

  ctrl.endpoint = angular.isDefined(ENDPOINT) ? ENDPOINT : '';

  ctrl.curImg = 0;

  ctrl.prevSlide = function() {
    ctrl.curImg = (ctrl.curImg + ctrl.images.length - 1) % ctrl.images.length;
  }

  ctrl.nextSlide = function() {
    ctrl.curImg = (ctrl.curImg + 1) % ctrl.images.length;
  }

  ctrl.goToSlide = function(slideIdx){
    ctrl.curImg = slideIdx
  }
};
